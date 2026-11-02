package local.jeff.mentalarithmetic;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Dependency-free acceptance runner for the signed, non-debuggable release APK.
 * Execute only on a disposable emulator, never on a personal device by default.
 * No test hooks, JavaScript bridge or debugging flag are added to the app. */
public final class AndroidTestRunner extends Instrumentation {
    private Activity activity;
    private WebView webView;
    private final JSONArray cases = new JSONArray();
    private File evidenceDirectory;
    private String scenario;
    private String seedUpgradeMarker;

    @Override public void onCreate(Bundle arguments) {
        super.onCreate(arguments);
        scenario = arguments == null ? "acceptance" : arguments.getString("scenario", "acceptance");
        seedUpgradeMarker = arguments == null ? null : arguments.getString("seed-upgrade-marker");
        start();
    }

    @Override public void onStart() {
        JSONObject report = new JSONObject();
        int exitCode = Activity.RESULT_OK;
        try {
            evidenceDirectory = new File(getTargetContext().getExternalFilesDir(null), "verification");
            if (!evidenceDirectory.mkdirs() && !evidenceDirectory.isDirectory()) {
                throw new AssertionError("Cannot create emulator evidence directory");
            }
            Intent intent = new Intent(Intent.ACTION_MAIN)
                    .setClassName(getTargetContext(), "local.jeff.mentalarithmetic.MainActivity")
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity = startActivitySync(intent);
            runOnMainSync(() -> webView = activity.findViewById(android.R.id.content)
                    .findViewWithTag("mental-arithmetic-webview"));
            check(webView != null, "Activity contains the actual release WebView");
            waitForJs("!!document.querySelector('#start')", 20_000);
            report.put("androidRelease", Build.VERSION.RELEASE);
            report.put("sdkInt", Build.VERSION.SDK_INT);
            report.put("supportedAbis", new JSONArray(Build.SUPPORTED_ABIS));
            report.put("model", Build.MODEL);
            report.put("package", getTargetContext().getPackageName());
            report.put("version", getTargetContext().getPackageManager().getPackageInfo(getTargetContext().getPackageName(), 0).versionName);
            report.put("webViewPackage", WebView.getCurrentWebViewPackage().packageName);
            report.put("webViewVersion", WebView.getCurrentWebViewPackage().versionName);
            report.put("scenario", scenario);

            if ("catalog".equals(scenario)) {
                runCase("actual installed lesson and practice options", this::installedOptions);
            } else {
                check("acceptance".equals(scenario), "Known instrumentation scenario");
                runCase("offline release shell, presentation and browser security", this::offlineShell);
                runCase("prominent learn button label, bounds and native tap", this::prominentHelp);
                runCase("four available random lessons, excluded addition lengths and complete instructions", this::randomLessons);
                runCase("vertical addition instructions, carries and final answers", this::additionTrace);
                runCase("Inside selects inner digits and Outside selects outer digits", this::insideOutsideTrace);
                runCase("random two-digit trace, confirmed carries and final answer", this::multiplicationTrace);
                runCase("three-digit multiplication groups and whole-value carries", this::threeDigitTrace);
                runCase("native numeric keyboard, visible answer and rotation preservation", this::nativeKeyboard);
                runCase("ten accepted answers, wrong feedback and exact timing summary", this::timingRound);
                runCase("four available practice configurations and addition length guard", this::practiceConfigurations);
            }
            report.put("passed", cases.length());
            report.put("failed", 0);
        } catch (Throwable error) {
            exitCode = Activity.RESULT_CANCELED;
            try {
                report.put("passed", cases.length());
                report.put("failed", 1);
                report.put("error", error.toString());
                screenshot("android-failure.png");
            } catch (Throwable ignored) { /* Preserve the original failure. */ }
        }
        try {
            report.put("cases", cases);
            report.put("finishedAtEpochMs", System.currentTimeMillis());
            report.put("runtimeExecution", true);
            write(new File(evidenceDirectory, "android-runtime-results.json"), report.toString(2));
        } catch (Throwable ignored) { exitCode = Activity.RESULT_CANCELED; }
        Bundle result = new Bundle();
        result.putString("report", report.toString());
        result.putString("evidenceDirectory", evidenceDirectory == null ? "" : evidenceDirectory.getAbsolutePath());
        result.putString("stream", "\nAndroid release acceptance: " + report.optInt("passed")
                + " passed, " + report.optInt("failed") + " failed.\n");
        finish(exitCode, result);
    }

    /** Inspect the installed release without assuming a particular catalog version. */
    private JSONObject installedOptions() throws Exception {
        if (seedUpgradeMarker != null) {
            js("localStorage.setItem('release-upgrade-probe'," + JSONObject.quote(seedUpgradeMarker) + ");return {};");
        }
        JSONObject result = js("""
            const initial={operation:q('#operation').value,digits:q('#digit-count').value,options:[...q('#digit-count').options].map(o=>o.value)};
            q('#mode-learn').click();
            const lessons=[...document.querySelectorAll('#lesson-catalog button')].map(b=>({id:b.dataset.lessonId,title:b.textContent}));
            q('#mode-practice').click();
            q('#operation').value='addition';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));
            const addition=[...q('#digit-count').options].map(o=>o.value);
            q('#operation').value='multiplication';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));
            const multiplication=[...q('#digit-count').options].map(o=>o.value);
            q('#operation').value='addition';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));
            return {initial,lessons,addition,multiplication,document:location.href,scripts:[...document.scripts].map(s=>s.src),visibleVersion:q('#app-version')?.textContent||null,upgradeMarker:localStorage.getItem('release-upgrade-probe')};
            """);
        AtomicReference<Integer> cacheMode = new AtomicReference<>();
        runOnMainSync(() -> cacheMode.set(webView.getSettings().getCacheMode()));
        result.put("cacheMode", cacheMode.get());
        screenshot("android-installed-practice.png");
        js("q('#mode-learn').click();scrollTo(0,0);return {};");
        screenshot("android-installed-learn.png");
        // The test runner's finish() ends its process. Give Chromium's delayed
        // DOM storage commit time to finish before a real package upgrade.
        if (seedUpgradeMarker != null) SystemClock.sleep(6_000);
        return result;
    }

    private JSONObject offlineShell() throws Exception {
        AtomicReference<JSONObject> settings = new AtomicReference<>();
        runOnMainSync(() -> {
            JSONObject value = new JSONObject();
            try {
                value.put("url", webView.getUrl());
                value.put("blockNetworkLoads", webView.getSettings().getBlockNetworkLoads());
                value.put("allowFileAccess", webView.getSettings().getAllowFileAccess());
                value.put("allowContentAccess", webView.getSettings().getAllowContentAccess());
                value.put("javascript", webView.getSettings().getJavaScriptEnabled());
                value.put("cacheMode", webView.getSettings().getCacheMode());
            } catch (Exception error) { throw new AssertionError(error); }
            settings.set(value);
        });
        JSONObject value = settings.get();
        check(value.getString("url").equals("https://appassets.androidplatform.net/index.html"), "Offline app origin");
        check(value.getBoolean("blockNetworkLoads"), "Network loads blocked");
        check(value.getInt("cacheMode") == android.webkit.WebSettings.LOAD_NO_CACHE, "WebView HTTP cache disabled");
        check(!value.getBoolean("allowFileAccess") && !value.getBoolean("allowContentAccess"), "File/content access disabled");
        js("""
            assert(getComputedStyle(document.documentElement).backgroundColor==='rgb(232, 215, 181)','sepia');
            assert(!q('#setup').hidden && q('#exercise').hidden,'manual start');
            assert(q('#operation').value==='addition','initial operation is addition');
            assert(q('#digit-count').value==='2' && JSON.stringify([...q('#digit-count').options].map(o=>o.value))==='["2"]','addition initially offers only two digits');
            assert(!q('#download-apps-link') && !q('#app-downloads'),'website download controls absent from offline native shell');
            assert(q('#app-version')?.textContent.includes('1.1.4'),'visible installed frontend version is 1.1.4');
            assert(q('#answer').inputMode==='numeric','numeric inputmode');
            assert([...document.querySelectorAll('script[src],link[rel=stylesheet]')].every(e=>new URL(e.src||e.href).origin===location.origin),'bundled scripts/styles');
            assert(!document.documentElement.scrollWidth || document.documentElement.scrollWidth<=innerWidth,'portrait width');
            return {origin:location.origin,userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight}};
            """);
        screenshot("android-setup.png");
        return value;
    }

    private JSONObject prominentHelp() throws Exception {
        JSONObject result = js("""
            q('#mode-learn').click();
            q('[data-lesson-id="multiplication-3"]').click();
            const help=q('#lesson-help');
            help.scrollIntoView({block:'center'});
            assert(help.textContent.includes('?') && help.textContent.includes('Click Here to Learn How!'),'visible question icon and exact instruction label');
            const label=help.querySelector('.lesson-help-label');
            assert(label.textContent==='Click Here to Learn How!' && !label.closest('[aria-hidden=true]'),'visible text supplies the accessible name');
            assert(help.querySelector('.lesson-help-icon').getAttribute('aria-hidden')==='true','decorative question icon excluded from accessible name');
            const b=help.getBoundingClientRect();
            assert(b.width>=180 && b.height>=44,'prominent native touch target');
            assert(b.left>=0 && b.right<=innerWidth+1 && b.top>=0 && b.bottom<=innerHeight+1,'CTA entirely in viewport');
            const range=document.createRange();range.selectNodeContents(help);
            assert([...range.getClientRects()].filter(r=>r.width&&r.height).every(r=>r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1),'visible CTA content fits inside button');
            return {label:help.textContent.trim(),accessibleLabel:label.textContent,width:b.width,height:b.height,viewportWidth:innerWidth};
            """);
        screenshot("android-learn-help-button.png");
        tapElement("#lesson-help");
        waitForJs("!document.querySelector('#walkthrough').hidden", 5_000);
        js("q('#close-walkthrough').click();return {};");
        return result;
    }

    private JSONObject randomLessons() throws Exception {
        return js("""
            q('#mode-learn').click();
            const ids=['multiplication-1','addition-2','multiplication-2','multiplication-3'];
            const titles=['Single-digit multiplication','Two-digit addition','Two-digit multiplication','Three-digit multiplication'];
            assert(JSON.stringify([...document.querySelectorAll('#lesson-catalog button')].map(e=>e.textContent))===JSON.stringify(titles),'catalog order');
            assert(!q('[data-lesson-id="addition-1"]') && !q('[data-lesson-id="addition-3"]'),'removed addition lengths absent from Learn');
            for(let i=0;i<ids.length;i++){
              q('[data-lesson-id="'+ids[i]+'"]').click();
              const digits=Number(ids[i].slice(-1));
              const addition=ids[i].startsWith('addition');
              let previous='';
              for(let n=0;n<4;n++){
                const values=[...document.querySelectorAll('#lesson-expression .learn-operand')].map(e=>Number(e.textContent));
                assert(values.length===2 && values.every(v=>v>=(digits===1?1:10**(digits-1))&&v<=10**digits-1),'operand range');
                const key=values.sort((a,b)=>a-b).join(':'); assert(key!==previous,'new unordered pair'); previous=key;
                q('#random-example').click();
              }
              assert(q('#lesson-help').textContent.includes('Click Here to Learn How!'),'learn label in every lesson');
              q('#lesson-help').click();
              assert(!/pending|not yet recovered/i.test(q('#walkthrough-status').textContent),'all scripts available');
              assert(q('#walkthrough .step-intermediate-result'),'calculation instruction');
              if(addition){
                const operands=[...q('#walkthrough .instruction-step .learn-expression').querySelectorAll('.learn-operand')].map(e=>e.getBoundingClientRect());
                assert(operands.every(b=>b.width>0&&b.height>0),'visible addition instruction operands');
                assert(operands[1].top>=operands[0].bottom-1,'addition operands above/below');
                assert(Math.abs(operands[1].right-operands[0].right)<2,'addition columns aligned');
                assert(q('#walkthrough .vertical-calculation'),'addition calculation stacked');
              }
              let count=0;while(!q('#step-next').disabled){q('#step-next').click();assert(++count<12,'bounded complete walkthrough');}
              assert(q('#final-answer').getAttribute('aria-current')==='step','final answer after instructions');
              const problem=[...q('#lesson-expression').querySelectorAll('.learn-operand')].map(e=>Number(e.textContent));
              const expected=addition?problem[0]+problem[1]:problem[0]*problem[1];
              assert(q('#walkthrough .final-answer-value').textContent===String(expected),'correct lesson final answer');
              q('#close-walkthrough').click();
            }
            return {lessonCategories:4,excludedLessons:['addition-1','addition-3'],randomRequestsPerCategory:4,completeWalkthroughs:4,verticalAdditionCategories:1};
            """);
    }

    /** Unequal cross-products make an Inside/Outside reversal observable. */
    private JSONObject insideOutsideTrace() throws Exception {
        JSONObject inside = js("""
            const saved=Math.random; const draws=[(82-10+.25)/90,(76-10+.25)/90]; Math.random=()=>draws.shift()??0;
            q('[data-lesson-id="multiplication-2"]').click(); Math.random=saved;
            assert(q('#lesson-expression .learn-expression').getAttribute('aria-label')==='82 times 76','owner screenshot problem reproduced');
            q('#lesson-help').click(); q('[data-stage-name="Inside"]').click();
            const refs=[...q('#step-content').querySelectorAll('.digit-highlight')].map(e=>e.dataset.digitRef);
            assert(JSON.stringify(refs)==='["left:1","right:0"]','Inside highlights the two inner digits');
            assert(q('#step-content .step-operation').getAttribute('aria-label')==='2 × 7','Inside multiplies 2 by 7');
            assert(q('#step-content .step-intermediate-result').textContent==='14','Inside result is 14');
            q('#step-content').scrollIntoView({block:'start'});
            return {operands:[82,76],stage:'Inside',highlightedDigitRefs:refs,calculation:'2 × 7',result:14};
            """);
        screenshot("android-inside-82-times-76.png");
        JSONObject outside = js("""
            q('[data-stage-name="Outside"]').click();
            const refs=[...q('#step-content').querySelectorAll('.digit-highlight')].map(e=>e.dataset.digitRef);
            assert(JSON.stringify(refs)==='["left:0","right:1"]','Outside highlights the two outer digits');
            assert(q('#step-content .step-operation').getAttribute('aria-label')==='8 × 6 = 48; 14 + 48','Outside multiplies 8 by 6 and combines Inside then Outside');
            assert(q('#step-content .step-intermediate-result').textContent==='62','cross-products sum to 62');
            assert(q('#step-content .step-narration').textContent.includes('14 + 48 = 62'),'cross-sum narration follows corrected stage order');
            q('#step-content').scrollIntoView({block:'start'});
            return {stage:'Outside',highlightedDigitRefs:refs,calculation:'8 × 6',result:48,insidePlusOutside:62};
            """);
        screenshot("android-outside-82-times-76.png");
        js("q('#final-answer').click();assert(q('#walkthrough .final-answer-value').textContent==='6232','correct final answer retained');return {};");
        return new JSONObject().put("inside", inside).put("outside", outside).put("finalAnswer", 6232);
    }

    private JSONObject multiplicationTrace() throws Exception {
        JSONObject result = js("""
            const saved=Math.random; const draws=[(98-10+.25)/90,(87-10+.25)/90]; Math.random=()=>draws.shift()??0;
            q('[data-lesson-id="multiplication-2"]').click(); Math.random=saved;
            assert(q('#lesson-expression .learn-expression').getAttribute('aria-label')==='98 times 87','asymmetric random problem');
            q('#lesson-help').click();
            const operations=['9 × 8','8 × 8','9 × 7 = 63; 64 + 63','8 × 7','127 + 5','72 + 13'];
            const values=['72','64','127','56','132','85'];
            for(let i=0;i<operations.length;i++){
              assert(q('#walkthrough .step-operation').getAttribute('aria-label')===operations[i],'operation '+i);
              assert(q('#walkthrough .step-intermediate-result').textContent===values[i],'result '+i);
              if(i===3)assert(q('.carry-out').textContent==='5','units carry');
              if(i===4)assert(q('.carry-in').textContent==='5' && q('.carry-out').textContent==='13','middle carry');
              q('#step-next').click();
            }
            assert(q('#final-answer').getAttribute('aria-current')==='step','separate final answer');
            assert(q('#walkthrough .learn-expression').getAttribute('aria-label')==='98 times 87 equals 8526','random product');
            const select=q('#worked-example'); select.value='18-times-18'; select.dispatchEvent(new Event('change',{bubbles:true}));
            const expected=['1','8','16','64','22','3'];
            for(let i=0;i<expected.length;i++){
              assert(q('#walkthrough .step-intermediate-result').textContent===expected[i],'confirmed carry trace '+i);
              q('#step-next').click();
            }
            assert(q('#walkthrough .learn-expression').getAttribute('aria-label')==='18 times 18 equals 324','confirmed product');
            q('#walkthrough').scrollIntoView({block:'start'});
            return {randomProduct:8526,confirmedProduct:324,stages:['First','Inside','Outside','Last','Final answer']};
            """);
        screenshot("android-learn-confirmed.png");
        return result;
    }

    private JSONObject additionTrace() throws Exception {
        JSONObject result = js("""
            let saved=Math.random;let draws=[(58-10+.25)/90,(67-10+.25)/90];Math.random=()=>draws.shift()??0;
            q('[data-lesson-id="addition-2"]').click();Math.random=saved;q('#lesson-help').click();
            const values=['11','15','12'];
            for(let i=0;i<values.length;i++){
              assert(q('#walkthrough .step-intermediate-result').textContent===values[i],'addition result '+i);
              assert(q('#walkthrough .vertical-calculation'),'addition step vertically arranged');
              q('#step-next').click();
            }
            assert(q('#walkthrough .learn-expression').getAttribute('aria-label')==='58 plus 67 equals 125','two-digit sum');
            const rows=[...q('#walkthrough .learn-expression').querySelectorAll('.learn-operand')].map(e=>e.getBoundingClientRect());
            assert(rows[1].top>=rows[0].bottom-1,'final addition still above/below');
            const digitRight=[...q('#walkthrough .learn-expression').querySelectorAll('.learn-operand')].map(e=>e.querySelector('.learn-digit:last-child').getBoundingClientRect().right);
            const answerRange=document.createRange();answerRange.selectNodeContents(q('#walkthrough .final-answer-value'));
            const answerRight=answerRange.getBoundingClientRect().right;
            assert(digitRight.every(right=>Math.abs(right-answerRight)<2),'actual unit digits align with wider three-digit answer');
            q('#walkthrough').scrollIntoView({block:'start'});
            return {twoDigit:{operands:[58,67],sum:125},allAdditionVertical:true};
            """);
        screenshot("android-learn-addition.png");
        return result;
    }

    private JSONObject threeDigitTrace() throws Exception {
        JSONObject result = js("""
            const saved=Math.random;const draws=[(123-100+.25)/900,(456-100+.25)/900];Math.random=()=>draws.shift()??0;
            q('[data-lesson-id="multiplication-3"]').click();Math.random=saved;q('#lesson-help').click();
            const operations=['1 × 4','1 × 5 + 2 × 4','1 × 6 + 3 × 4 + 2 × 5','2 × 6 + 3 × 5','3 × 6','27 + 1','28 + 2','13 + 3','4 + 1'];
            const values=['4','13','28','27','18','28','30','16','5'];
            for(let i=0;i<operations.length;i++){
              assert(q('#walkthrough .step-operation').getAttribute('aria-label')===operations[i],'three-digit group '+i);
              assert(q('#walkthrough .step-intermediate-result').textContent===values[i],'three-digit result '+i);
              if(i===2)assert([...q('#walkthrough .vertical-calculation').querySelectorAll('.calculation-row')].length===3,'three central products vertically summed');
              q('#step-next').click();
            }
            assert(q('#walkthrough .learn-expression').getAttribute('aria-label')==='123 times 456 equals 56088','three-digit product');
            assert(q('#final-answer').getAttribute('aria-current')==='step','separate final answer');
            q('#walkthrough').scrollIntoView({block:'start'});
            return {operands:[123,456],groupResults:[4,13,28,27,18],resolved:[28,30,16,5],product:56088};
            """);
        screenshot("android-learn-three-digit.png");
        return result;
    }

    private JSONObject nativeKeyboard() throws Exception {
        js("""
            q('#mode-practice').click(); q('#operation').value='multiplication'; q('#operation').dispatchEvent(new Event('change',{bubbles:true})); q('#digit-count').value='3';
            q('#start').scrollIntoView({block:'center'}); return {};
            """);
        tapElement("#start");
        waitForJs("!document.querySelector('#exercise').hidden", 5_000);
        tapElement("#answer");
        long deadline = SystemClock.uptimeMillis() + 8_000;
        while (!imeVisible() && SystemClock.uptimeMillis() < deadline) SystemClock.sleep(100);
        check(imeVisible(), "Android software keyboard became visible after a real native tap");
        SystemClock.sleep(500);
        AtomicReference<Integer> inputType = new AtomicReference<>();
        runOnMainSync(() -> { EditorInfo info = new EditorInfo(); webView.onCreateInputConnection(info); inputType.set(info.inputType); });
        check((inputType.get() & android.text.InputType.TYPE_MASK_CLASS) == android.text.InputType.TYPE_CLASS_NUMBER,
                "Android input connection requests a numeric keyboard");
        JSONObject layout = js("""
            const viewport=visualViewport; const answer=q('#answer').getBoundingClientRect(); const live=q('#live-time').getBoundingClientRect();
            const bottom=(viewport?.offsetTop||0)+(viewport?.height||innerHeight);
            assert(answer.bottom<=bottom+2 && live.bottom<=bottom+2,'answer/live timer above software keyboard');
            assert(answer.left>=0 && live.right<=innerWidth+1,'answer/live timer inside viewport width');
            assert(getComputedStyle(q('#problem')).fontFamily.startsWith('Arial'),'Arial numerals');
            window.__rotationMarker='preserved';
            return {answerBottom:answer.bottom,liveBottom:live.bottom,viewportBottom:bottom,viewportHeight:viewport?.height||innerHeight,problemId:q('#answer').dataset.problemId};
            """);
        layout.put("nativeInputType", inputType.get());
        layout.put("softwareKeyboardVisible", true);
        screenshot("android-practice-keyboard.png");
        sendStringSync("1");
        waitForJs("document.querySelector('#answer').value==='1'", 5_000);
        JSONObject before = js("return {problem:q('#answer').dataset.problemId,value:q('#answer').value,time:Number(q('#live-time').textContent)};");
        runOnMainSync(() -> {
            InputMethodManager manager = (InputMethodManager) activity.getSystemService(Activity.INPUT_METHOD_SERVICE);
            manager.hideSoftInputFromWindow(webView.getWindowToken(), 0);
            activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        });
        waitOrientation(Configuration.ORIENTATION_LANDSCAPE);
        SystemClock.sleep(300);
        JSONObject rotated = js("assert(window.__rotationMarker==='preserved','JS state survives rotation'); return {problem:q('#answer').dataset.problemId,value:q('#answer').value,time:Number(q('#live-time').textContent)};");
        check(before.getString("problem").equals(rotated.getString("problem")), "Rotation preserves active problem");
        check(before.getString("value").equals(rotated.getString("value")), "Rotation preserves incomplete input");
        check(rotated.getDouble("time") >= before.getDouble("time"), "Rotation preserves live timer progress");
        runOnMainSync(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        waitOrientation(Configuration.ORIENTATION_PORTRAIT);
        js("return {remaining:10};");
        for (int index = 0; index < 10; index++) {
            String answer = js("return {answer:String(Number(q('#left-operand').textContent)*Number(q('#right-operand').textContent))};").getString("answer");
            if (index == 0) {
                // An incomplete value from native key input belongs to this same problem.
                js("q('#answer').value=''; q('#answer').dispatchEvent(new Event('input',{bubbles:true})); return {};");
            }
            sendStringSync(answer);
            SystemClock.sleep(25);
        }
        waitForJs("document.querySelector('#score').textContent==='10 / 10'", 5_000);
        layout.put("rotationPreservedState", true);
        layout.put("nativeKeyEventRoundScore", "10 / 10");
        return layout;
    }

    private JSONObject timingRound() throws Exception {
        JSONObject result = js("""
            const actualNow=performance.now.bind(performance); let clock=10000;
            Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});
            q('#operation').value='multiplication'; q('#operation').dispatchEvent(new Event('change',{bubbles:true})); q('#digit-count').value='3'; q('#start').click();
            assert(q('#round-timing').hidden,'summary cleared');
            const durations=[220,530,1499,1499,1499,1499,1499,1499,1499,1499];
            for(let i=0;i<10;i++){
              assert(q('#round-timing').hidden,'summary absent before tenth');
              const id=q('#answer').dataset.problemId;
              const expected=String(Number(q('#left-operand').textContent)*Number(q('#right-operand').textContent));
              clock+=durations[i]; q('#answer').value=i===1?'0'.repeat(expected.length):expected;
              q('#answer').dispatchEvent(new Event('input',{bubbles:true}));
              if(i<9){assert(q('#answer').dataset.problemId!==id,'immediate advance'); assert(document.activeElement===q('#answer'),'answer focus');}
              if(i===1)assert(getComputedStyle(q('#previous-time')).color==='rgb(176, 0, 0)','incorrect time red');
            }
            assert(q('#score').textContent==='9 / 10','score');
            assert(q('#minimum-time').textContent==='0.2 s','minimum');
            assert(q('#maximum-time').textContent==='1.4 s','maximum');
            assert(q('#average-time').textContent==='1.2 s','raw average including incorrect');
            q('#mode-learn').click(); q('#mode-practice').click(); assert(q('#average-time').textContent==='1.2 s','summary survives Learn');
            Object.defineProperty(performance,'now',{configurable:true,value:actualNow});
            q('#setup').scrollIntoView({block:'start'});
            return {score:q('#score').textContent,minimum:q('#minimum-time').textContent,maximum:q('#maximum-time').textContent,average:q('#average-time').textContent,durations};
            """);
        screenshot("android-round-timing.png");
        return result;
    }

    private JSONObject practiceConfigurations() throws Exception {
        return js("""
            const configurations=[['addition',2],['multiplication',1],['multiplication',2],['multiplication',3]];
            const setOperation=operation=>{q('#operation').value=operation;q('#operation').dispatchEvent(new Event('change',{bubbles:true}));};
            for(const priorDigits of [1,3]){
              setOperation('multiplication');q('#digit-count').value=String(priorDigits);setOperation('addition');
              assert(q('#digit-count').value==='2','switching to addition resets unsupported length');
              assert(JSON.stringify([...q('#digit-count').options].map(o=>o.value))==='["2"]','only two-digit addition option exists');
            }
            for(const [operation,digits] of configurations){
              setOperation(operation);
              const expectedOptions=operation==='addition'?['2']:['1','2','3'];
              assert(JSON.stringify([...q('#digit-count').options].map(o=>o.value))===JSON.stringify(expectedOptions),'available operation lengths');
              q('#digit-count').value=String(digits); q('#start').click();
              assert(q('#round-timing').hidden && q('#setup').hidden,'manual restart clears result');
              const seen=new Set();
              for(let i=0;i<10;i++){
                const a=Number(q('#left-operand').textContent),b=Number(q('#right-operand').textContent);
                const low=digits===1?1:10**(digits-1),high=10**digits-1;
                assert(a>=low&&a<=high&&b>=low&&b<=high,'range');
                const key=[a,b].sort((x,y)=>x-y).join(':'); assert(!seen.has(key),'unique pair'); seen.add(key);
                if(operation==='addition'){
                  const top=q('#left-operand').getBoundingClientRect(),bottom=q('#right-operand').getBoundingClientRect();
                  assert(bottom.top>=top.bottom-1,'practice addition above/below');
                  assert(Math.abs(top.right-bottom.right)<2,'practice addition columns aligned');
                }
                q('#answer').value=String(operation==='addition'?a+b:a*b); q('#answer').dispatchEvent(new Event('input',{bubbles:true}));
              }
              assert(q('#score').textContent==='10 / 10','ten-problem score');
              assert(!q('#round-timing').hidden,'timing summary');
            }
            return {configurations:4,acceptedAnswers:40,allScores:'10 / 10',additionOptions:[2],multiplicationOptions:[1,2,3],unsupportedSwitchesResetToTwo:true};
            """);
    }

    private JSONObject js(String body) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        String script = "(()=>{const q=s=>document.querySelector(s);const assert=(p,m)=>{if(!p)throw Error(m)};"
                + "try{return JSON.stringify({ok:true,value:(()=>{" + body + "})()})}"
                + "catch(e){return JSON.stringify({ok:false,error:String(e),stack:e.stack})}})()";
        runOnMainSync(() -> webView.evaluateJavascript(script, value -> { result.set(value); done.countDown(); }));
        check(done.await(10, TimeUnit.SECONDS), "JavaScript evaluation returned");
        Object decoded = new JSONTokener(result.get()).nextValue();
        JSONObject wrapper = new JSONObject(String.valueOf(decoded));
        check(wrapper.getBoolean("ok"), wrapper.optString("error") + " " + wrapper.optString("stack"));
        return wrapper.optJSONObject("value") == null ? new JSONObject() : wrapper.getJSONObject("value");
    }

    private void waitForJs(String condition, long timeout) throws Exception {
        long deadline = SystemClock.uptimeMillis() + timeout;
        while (SystemClock.uptimeMillis() < deadline) {
            if (js("return {ready:Boolean(" + condition + ")};").optBoolean("ready")) return;
            SystemClock.sleep(100);
        }
        throw new AssertionError("Timed out waiting for " + condition);
    }

    private void tapElement(String selector) throws Exception {
        JSONObject rect = js("const b=q(" + JSONObject.quote(selector) + ").getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2,width:innerWidth};");
        int[] nativePosition = new int[2];
        AtomicReference<Integer> nativeWidth = new AtomicReference<>();
        runOnMainSync(() -> { webView.getLocationOnScreen(nativePosition); nativeWidth.set(webView.getWidth()); });
        double scale = nativeWidth.get() / rect.getDouble("width");
        float x = (float) (nativePosition[0] + rect.getDouble("x") * scale);
        float y = (float) (nativePosition[1] + rect.getDouble("y") * scale);
        long downTime = SystemClock.uptimeMillis();
        MotionEvent down = MotionEvent.obtain(downTime, downTime, MotionEvent.ACTION_DOWN, x, y, 0);
        down.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        sendPointerSync(down);
        MotionEvent up = MotionEvent.obtain(downTime, SystemClock.uptimeMillis() + 40, MotionEvent.ACTION_UP, x, y, 0);
        up.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        sendPointerSync(up);
        down.recycle(); up.recycle();
        waitForIdleSync();
    }

    private boolean imeVisible() {
        AtomicReference<Boolean> visible = new AtomicReference<>(false);
        runOnMainSync(() -> {
            WindowInsets insets = activity.getWindow().getDecorView().getRootWindowInsets();
            if (insets != null) visible.set(insets.isVisible(WindowInsets.Type.ime()));
        });
        return visible.get();
    }

    private void waitOrientation(int desired) {
        long deadline = SystemClock.uptimeMillis() + 8_000;
        while (activity.getResources().getConfiguration().orientation != desired
                && SystemClock.uptimeMillis() < deadline) SystemClock.sleep(100);
        check(activity.getResources().getConfiguration().orientation == desired, "Requested emulator orientation");
        waitForIdleSync();
    }

    private void screenshot(String name) throws Exception {
        SystemClock.sleep(200);
        Bitmap image = getUiAutomation().takeScreenshot();
        check(image != null, "Native screenshot available");
        try (FileOutputStream stream = new FileOutputStream(new File(evidenceDirectory, name))) {
            check(image.compress(Bitmap.CompressFormat.PNG, 100, stream), "PNG screenshot saved");
        } finally { image.recycle(); }
    }

    private void runCase(String name, CheckedCase test) throws Exception {
        long started = SystemClock.elapsedRealtime();
        JSONObject details = test.run();
        JSONObject result = new JSONObject().put("name", name).put("status", "passed")
                .put("durationMs", SystemClock.elapsedRealtime() - started).put("details", details);
        cases.put(result);
        Bundle progress = new Bundle();
        progress.putString("stream", "PASS " + name + "\n");
        sendStatus(0, progress);
    }

    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    private static void write(File target, String value) throws Exception {
        try (FileOutputStream stream = new FileOutputStream(target)) {
            stream.write((value + "\n").getBytes(StandardCharsets.UTF_8));
        }
    }

    private interface CheckedCase { JSONObject run() throws Exception; }
}
