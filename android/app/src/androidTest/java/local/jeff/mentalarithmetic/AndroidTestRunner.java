package local.jeff.mentalarithmetic;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
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
                runCase("exactly two multiplication Learn lessons with random complete instructions", this::randomLessons);
                runCase("two-digit addition Practice, vertical operands and digit-count auto-submission", this::additionPractice);
                runCase("Inside selects inner digits and Outside selects outer digits", this::insideOutsideTrace);
                runCase("random two-digit trace, confirmed carries and final answer", this::multiplicationTrace);
                runCase("literal ampersand grouped First middle Last expression, equal filled stages and separate Final Answer", this::groupedStageHeader);
                runCase("scholarly Learn palette, shared stage emphasis and explicit carry routes", this::scholarlyLearn);
                runCase("single-digit multiplication instruction, final answer and fresh example reset", this::singleDigitTrace);
                runCase("native numeric keyboard, visible answer and rotation preservation", this::nativeKeyboard);
                runCase("monochrome incorrect feedback and white answer field", this::monochromePractice);
                runCase("ten accepted answers, wrong feedback and exact timing summary", this::timingRound);
                runCase("exactly three Practice configurations, ten unique questions each and option guards", this::practiceConfigurations);
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
            const selectedLesson=q('#lesson-catalog [aria-current=page]')?.dataset.lessonId||null;
            q('#mode-practice').click();
            q('#operation').value='addition';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));
            const addition=[...q('#digit-count').options].map(o=>o.value);
            q('#operation').value='multiplication';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));
            const multiplication=[...q('#digit-count').options].map(o=>o.value);
            q('#operation').value='addition';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));
            return {initial,lessons,selectedLesson,addition,multiplication,document:location.href,scripts:[...document.scripts].map(s=>s.src),visibleVersion:q('#app-version')?.textContent||null,upgradeMarker:localStorage.getItem('release-upgrade-probe')};
            """);
        AtomicReference<Integer> cacheMode = new AtomicReference<>();
        runOnMainSync(() -> cacheMode.set(webView.getSettings().getCacheMode()));
        result.put("cacheMode", cacheMode.get());
        screenshot("android-installed-practice.png");
        js("q('#operation').value='multiplication';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));scrollTo(0,0);return {};");
        screenshot("android-installed-practice-multiplication.png");
        js("q('#operation').value='addition';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));q('#mode-learn').click();scrollTo(0,0);return {};");
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
                value.put("nativePaper", ((ColorDrawable) ((View) webView.getParent()).getBackground()).getColor());
                value.put("lightStatusBar", (activity.getWindow().getDecorView().getSystemUiVisibility()
                        & View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR) != 0);
                value.put("lightNavigationBar", (activity.getWindow().getDecorView().getSystemUiVisibility()
                        & View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR) != 0);
            } catch (Exception error) { throw new AssertionError(error); }
            settings.set(value);
        });
        JSONObject value = settings.get();
        check(value.getString("url").equals("https://appassets.androidplatform.net/index.html"), "Offline app origin");
        check(value.getBoolean("blockNetworkLoads"), "Network loads blocked");
        check(value.getInt("cacheMode") == android.webkit.WebSettings.LOAD_NO_CACHE, "WebView HTTP cache disabled");
        check(!value.getBoolean("allowFileAccess") && !value.getBoolean("allowContentAccess"), "File/content access disabled");
        check(value.getInt("nativePaper") == Color.rgb(250, 247, 240), "Native inset/container background is ivory");
        check(value.getBoolean("lightStatusBar") && value.getBoolean("lightNavigationBar"), "Native bar icons use dark-on-light appearance");
        js("""
            assert(getComputedStyle(document.documentElement).backgroundColor==='rgb(250, 247, 240)','ivory');
            assert(getComputedStyle(document.body).fontFamily.startsWith('Baskerville'),'scholarly text font stack');
            assert(!q('#setup').hidden && q('#exercise').hidden,'manual start');
            assert(q('#operation').value==='addition','initial operation is addition');
            assert(q('#digit-count').value==='2' && JSON.stringify([...q('#digit-count').options].map(o=>o.value))==='["2"]','addition initially offers only two digits');
            assert(!q('#download-apps-link') && !q('#app-downloads'),'website download controls absent from offline native shell');
            assert(q('#app-version')?.textContent==='Version 1.2.0','visible installed frontend version is stable 1.2.0');
            q('#mode-learn').click();assert(q('#lesson-catalog [aria-current=page]')?.dataset.lessonId==='multiplication-1','Learn starts on single-digit multiplication');assert(JSON.stringify([...q('#lesson-catalog').querySelectorAll('button')].map(b=>b.dataset.lessonId))==='["multiplication-1","multiplication-2"]','fresh Learn menu offers only M1 and M2');q('#mode-practice').click();
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
            q('[data-lesson-id="multiplication-2"]').click();
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
            const ids=['multiplication-1','multiplication-2'];
            const titles=['Single-digit multiplication','Two-digit multiplication'];
            const offered=[...document.querySelectorAll('#lesson-catalog button')];
            assert(JSON.stringify(offered.map(e=>e.dataset.lessonId))===JSON.stringify(ids),'Learn offers exactly the two multiplication lessons');
            assert(JSON.stringify(offered.map(e=>e.textContent))===JSON.stringify(titles),'catalog order and full labels');
            const removed=['addition-1','addition-2','addition-3','multiplication-3'];
            assert(removed.every(id=>!q('[data-lesson-id="'+id+'"]')),'all addition Learn and three-digit multiplication are absent');
            for(let i=0;i<ids.length;i++){
              q('[data-lesson-id="'+ids[i]+'"]').click();
              const digits=Number(ids[i].slice(-1));
              let previous='';
              for(let n=0;n<4;n++){
                const values=[...document.querySelectorAll('#lesson-expression .learn-operand')].map(e=>Number(e.textContent));
                assert(values.length===2 && values.every(v=>v>=(digits===1?1:10**(digits-1))&&v<=10**digits-1),'offered lesson operand range');
                const key=values.sort((a,b)=>a-b).join(':');assert(key!==previous,'new unordered pair');previous=key;
                q('#random-example').click();
              }
              assert(q('#lesson-help').textContent.includes('Click Here to Learn How!'),'learn label in every offered lesson');
              q('#lesson-help').click();
              assert(!/pending|not yet recovered/i.test(q('#walkthrough-status').textContent),'complete offered instructions');
              assert(q('#walkthrough .step-intermediate-result'),'calculation instruction');
              let count=0;while(!q('#step-next').disabled){q('#step-next').click();assert(++count<12,'bounded complete walkthrough');}
              assert(q('#final-answer').getAttribute('aria-current')==='step','final answer after instructions');
              const problem=[...q('#lesson-expression').querySelectorAll('.learn-operand')].map(e=>Number(e.textContent));
              assert(q('#walkthrough .final-answer-value').textContent===String(problem[0]*problem[1]),'correct multiplication final answer');
              q('#close-walkthrough').click();
            }
            return {lessonCategories:2,offeredLessons:ids,excludedLessons:removed,randomRequestsPerCategory:4,completeWalkthroughs:2};
            """);
    }

    /** Unequal cross-products make an Inside/Outside reversal observable. */
    private JSONObject insideOutsideTrace() throws Exception {
        JSONObject inside = js("""
            q('#mode-learn').click();q('[data-lesson-id="multiplication-1"]').click();
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
            return {randomProduct:8526,confirmedProduct:324,stages:['First','Inside','Outside','Last','Final Answer']};
            """);
        screenshot("android-learn-confirmed.png");
        return result;
    }

    private JSONObject groupedStageHeader() throws Exception {
        JSONObject portrait = js("""
            q('#mode-learn').click();
            const saved=Math.random,draws=[(98-10+.25)/90,(87-10+.25)/90];Math.random=()=>draws.shift()??0;
            q('[data-lesson-id="multiplication-2"]').click();Math.random=saved;q('#lesson-help').click();
            const group=q('#stage-product-group'),middle=q('#stage-middle-group'),plus=q('#stage-middle-plus'),equals=q('#stage-equals'),result=q('#final-answer');
            assert(group && middle && plus && equals && result,'complete grouped stage expression');
            assert(middle.getAttribute('role')==='group' && middle.getAttribute('aria-label').includes('Inside') && middle.getAttribute('aria-label').includes('Outside'),'middle relationship has an accessible group label');
            const names=['First','Inside','Outside','Last'];
            let buttons=names.map(name=>q('#stage-sequence button[data-stage-name="'+name+'"]'));
            assert(buttons.every(button=>group.contains(button)) && group.contains(middle),'outer product group encloses all four stages and middle');
            assert(middle.contains(buttons[1]) && middle.contains(buttons[2]) && middle.contains(plus),'middle groups Inside plus Outside');
            assert(!middle.contains(buttons[0]) && !middle.contains(buttons[3]),'First and Last remain outside middle subgroup');
            assert(!group.contains(result) && !group.contains(equals),'equals and Final Answer are outside product group');
            assert(plus.textContent.trim()==='+' && equals.textContent.trim()==='=','explicit plus and equals glyphs');
            assert(q('#stage-connection-first').textContent.trim()==='&' && q('#stage-connection-last').textContent.trim()==='&','exactly two literal header ampersands');
            assert((group.textContent.match(/&/g)||[]).length===2 && !group.textContent.includes('→') && !group.textContent.includes('↓'),'header connectors use only the two literal ampersands');
            assert(result.textContent==='Final Answer: 8526','capitalized complete Final Answer caption');
            const order=[...q('#stage-sequence').querySelectorAll('button')].map(b=>b.dataset.stageName||'Final Answer');
            assert(JSON.stringify(order)===JSON.stringify([...names,'Final Answer']),'unchanged instructional button order');
            const before=(a,b)=>Boolean(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
            assert(before(buttons[0],middle) && before(middle,buttons[3]) && before(group,equals) && before(equals,result),'nested equation follows First middle Last equals Final Answer');
            const colors=['rgb(18, 108, 112)','rgb(117, 80, 147)','rgb(117, 80, 147)','rgb(136, 90, 21)'];
            const fills=['rgb(226, 241, 239)','rgb(238, 229, 244)','rgb(238, 229, 244)','rgb(246, 236, 216)'];
            const inspect=()=>buttons.map((button,i)=>{const s=getComputedStyle(button);assert(s.fontWeight==='700','every stage bold');assert(s.color===colors[i] && s.backgroundColor===fills[i],'matched stage text and lighter tint');for(const side of ['Top','Right','Bottom','Left']){assert(s['border'+side+'Style']==='solid' && s['border'+side+'Color']===colors[i] && Math.abs(parseFloat(s['border'+side+'Width'])-2)<=1/devicePixelRatio,'equal colored 2px stage strokes');}return {name:names[i],color:s.color,fill:s.backgroundColor,fontWeight:s.fontWeight,borderWidth:s.borderTopWidth};});
            const initial=inspect();buttons[2].click();buttons=names.map(name=>q('#stage-sequence button[data-stage-name="'+name+'"]'));const selected=inspect();
            assert(buttons[2].getAttribute('aria-current')==='step','Outside still navigates to existing instructional step');
            assert(getComputedStyle(buttons[2]).textDecorationLine.includes('underline') && !getComputedStyle(buttons[0]).textDecorationLine.includes('underline'),'selection is distinguished by underline without changing weight or stroke');
            q('#stage-sequence').scrollIntoView({block:'start'});
            return {order,initialStyles:initial,selectedStyles:selected,grouping:'[First & [Inside + Outside] & Last] = [Final Answer: 8526]'};
            """);
        JSONObject portraitBounds = groupedHeaderBounds();
        screenshot("android-grouped-stages-portrait.png");
        runOnMainSync(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        waitOrientation(Configuration.ORIENTATION_LANDSCAPE);
        waitForJs("innerWidth>innerHeight", 5_000);
        JSONObject landscapeBounds = groupedHeaderBounds();
        // Let the native rotation compositor settle before the review capture.
        SystemClock.sleep(600);
        screenshot("android-grouped-stages-landscape.png");
        runOnMainSync(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        waitOrientation(Configuration.ORIENTATION_PORTRAIT);
        waitForJs("innerWidth<innerHeight", 5_000);
        js("q('#final-answer').click();assert(q('#walkthrough .final-answer-value').textContent==='8526','separate Final Answer remains interactive');return {};");
        return portrait.put("portrait", portraitBounds).put("landscape", landscapeBounds);
    }

    private JSONObject groupedHeaderBounds() throws Exception {
        return js("""
            q('#stage-sequence').scrollIntoView({block:'start'});
            const selectors=['#stage-sequence','#stage-product-group','#stage-middle-group','#stage-middle-plus','#stage-connection-first','#stage-connection-last','#stage-equals','#final-answer'];
            const bounds=Object.fromEntries(selectors.map(s=>[s,q(s).getBoundingClientRect()]));
            assert(document.documentElement.scrollWidth<=innerWidth+1,'grouped stages do not cause horizontal page clipping');
            for(const selector of selectors){const b=bounds[selector];assert(b.width>0 && b.height>0 && b.left>=-1 && b.right<=innerWidth+1,'grouped stage horizontal bounds '+selector);}
            const inside=(outer,b)=>b.left>=outer.left-1&&b.right<=outer.right+1&&b.top>=outer.top-1&&b.bottom<=outer.bottom+1;
            const separate=(a,b)=>a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1;
            const buttons=[...q('#stage-product-group').querySelectorAll('button')];
            assert(buttons.length===4,'outer group contains only the four instructional buttons');
            for(const button of buttons){const b=button.getBoundingClientRect();assert(inside(bounds['#stage-product-group'],b),'stage remains inside outer outline');assert(b.height>=43&&b.width>=43,'stage touch target at least44px after rounding');}
            for(const button of q('#stage-middle-group').querySelectorAll('button'))assert(inside(bounds['#stage-middle-group'],button.getBoundingClientRect()),'middle stages remain inside shared outline');
            assert(inside(bounds['#stage-middle-group'],bounds['#stage-middle-plus']),'plus remains inside middle outline');
            for(const selector of ['#stage-middle-group','#stage-connection-first','#stage-connection-last'])assert(inside(bounds['#stage-product-group'],bounds[selector]),'nested stages and ampersands remain inside outer outline');
            for(const selector of ['#stage-connection-first','#stage-connection-last']){const mark=q(selector),transform=getComputedStyle(mark).transform;assert(mark.textContent.trim()==='&' && (transform==='none'||transform==='matrix(1, 0, 0, 1, 0, 0)'),'header ampersand stays unrotated in each orientation');}
            for(let a=0;a<buttons.length;a++)for(let b=a+1;b<buttons.length;b++)assert(separate(buttons[a].getBoundingClientRect(),buttons[b].getBoundingClientRect()),'stage buttons do not overlap');
            assert(separate(bounds['#stage-product-group'],bounds['#final-answer']) && separate(bounds['#stage-equals'],bounds['#final-answer']),'final answer is visually separate');
            return {width:innerWidth,height:innerHeight,bounds};
            """);
    }

    private JSONObject scholarlyLearn() throws Exception {
        js("""
            q('#mode-learn').click(); q('[data-lesson-id="multiplication-1"]').click();
            const saved=Math.random; const draws=[(98-10+.25)/90,(87-10+.25)/90]; Math.random=()=>draws.shift()??0;
            q('[data-lesson-id="multiplication-2"]').click(); Math.random=saved; q('#lesson-help').click();
            return {};
            """);
        String[] stages = { "First", "Inside", "Outside", "Last" };
        String[] colors = { "rgb(18, 108, 112)", "rgb(117, 80, 147)", "rgb(117, 80, 147)", "rgb(136, 90, 21)" };
        JSONArray palette = new JSONArray();
        String borderWidth = null;
        for (int index = 0; index < stages.length; index++) {
            String stage = stages[index];
            JSONObject details = js("const stage=" + JSONObject.quote(stage) + ";"
                    + "q('#stage-sequence button[data-stage-name='+stage+']').click();"
                    + "const section=q('#step-content .instruction-step'), digit=q('#step-content .digit-highlight'), style=getComputedStyle(digit);"
                    + "assert(section.dataset.stageTone===stage.toLowerCase() && section.querySelector('h3').textContent===stage,'active section exposes named stage and tone');"
                    + "assert(style.color===" + JSONObject.quote(colors[index]) + ",'correct named stage palette');"
                    + "assert(style.fontFamily.startsWith('Arial'),'highlighted mathematical digits retain Arial stack');"
                    + "assert(getComputedStyle(q('#step-content h3')).fontFamily.startsWith('Baskerville'),'instruction heading uses scholarly serif stack');"
                    + "assert(document.documentElement.scrollWidth<=innerWidth+1,'lesson has no horizontal clipping');"
                    + "q('#step-content').scrollIntoView({block:'start'});"
                    + "return {stage,color:style.color,borderWidth:style.borderBottomWidth,fontFamily:style.fontFamily,refs:[...section.querySelectorAll('.digit-highlight')].map(e=>e.dataset.digitRef)};");
            if (borderWidth == null) borderWidth = details.getString("borderWidth");
            else check(borderWidth.equals(details.getString("borderWidth")), "All stages use equal highlight border weight");
            palette.put(details);
            if (index == 0 || index == 3) screenshot("android-learn-" + stage.toLowerCase() + ".png");
        }
        JSONObject carries = js("""
            const readRoute=route=>({kind:route.dataset.routeKind,from:route.querySelector('.carry-route-origin').textContent.trim(),value:route.querySelector('.carry-route-value').textContent.trim(),to:route.querySelector('.carry-route-destination').textContent.trim(),text:route.textContent.trim()});
            const out=q('#step-content .carry-route[data-route-kind="out"]'); assert(out,'Last has explicit outgoing route');
            const last=readRoute(out);
            assert(last.value==='5' && last.from.includes('Last') && last.to.includes('Inside + Outside'),'units carry names its source and destination');
            assert((last.text.match(/→/g)||[]).length>=2,'carry is shown as source to value to destination');
            q('#step-next').click();
            const routes=[...q('#step-content').querySelectorAll('.carry-route')].map(readRoute);
            assert(routes.some(r=>r.kind==='in' && r.value==='5' && r.from.includes('Last')),'middle carry shows incoming value from Last');
            assert(routes.some(r=>r.kind==='out' && r.value==='13' && r.to.includes('First')),'middle carry shows whole outgoing value to First');
            assert(q('#step-content .carry-in').textContent==='5' && q('#step-content .carry-out').textContent==='13','existing carry details preserved');
            q('#step-content').scrollIntoView({block:'start'});
            return {last,middle:routes};
            """);
        screenshot("android-learn-carry-routes.png");
        return new JSONObject().put("palette", palette).put("equalHighlightBorder", borderWidth).put("carries", carries);
    }

    private JSONObject additionPractice() throws Exception {
        JSONObject result = js("""
            q('#mode-practice').click();q('#operation').value='addition';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));
            assert(JSON.stringify([...q('#digit-count').options].map(o=>o.value))==='["2"]','Practice preserves exactly two-digit addition');
            // Canonical pair 58:67 has rank 3201 among 4095 two-digit unordered pairs.
            const saved=Math.random,draws=[(3201+.25)/4095,0];Math.random=()=>draws.shift()??saved();q('#start').click();Math.random=saved;
            assert(q('#left-operand').textContent==='58' && q('#right-operand').textContent==='67','both seeded addition operands have two digits');
            const top=q('#left-operand').getBoundingClientRect(),bottom=q('#right-operand').getBoundingClientRect();
            assert(bottom.top>=top.bottom-1 && Math.abs(top.right-bottom.right)<2,'addition operands are above/below with aligned columns');
            assert(q('#problem').classList.contains('vertical-addition') && q('#problem').getAttribute('aria-label')==='58 plus 67','addition retains its vertical accessible expression');
            const firstId=q('#answer').dataset.problemId;
            q('#answer').value='12';q('#answer').dispatchEvent(new Event('input',{bubbles:true}));
            assert(q('#answer').dataset.problemId===firstId && q('#answer').value==='12' && q('#previous-feedback').hidden,'partial two-of-three-digit sum is retained');
            q('#answer').value='125';q('#answer').dispatchEvent(new Event('input',{bubbles:true}));
            assert(q('#answer').dataset.problemId!==firstId && q('#answer').value==='' && q('#previous-feedback').dataset.correct==='true','three expected digits auto-submit 125 without Enter');
            const seen=new Set(['58:67']);
            for(let i=1;i<10;i++){
              const a=Number(q('#left-operand').textContent),b=Number(q('#right-operand').textContent);
              assert(a>=10 && a<=99 && b>=10 && b<=99,'every remaining addition question has two two-digit operands');
              const key=[a,b].sort((x,y)=>x-y).join(':');assert(!seen.has(key),'addition round pairs remain unique');seen.add(key);
              q('#answer').value=String(a+b);q('#answer').dispatchEvent(new Event('input',{bubbles:true}));
            }
            assert(q('#score').textContent==='10 / 10' && !q('#round-timing').hidden,'preserved addition completes exactly ten accepted answers with timing');
            q('#setup').scrollIntoView({block:'start'});
            return {operands:[58,67],sum:125,operandDigits:[2,2],verticalColumns:true,partialInput:'12',automaticSubmission:'125',acceptedAnswers:10,uniquePairs:seen.size,score:q('#score').textContent};
            """);
        screenshot("android-practice-two-digit-addition.png");
        return result;
    }

    private JSONObject singleDigitTrace() throws Exception {
        JSONObject result = js("""
            q('#mode-learn').click();
            const saved=Math.random,draws=[(8-1+.25)/9,(7-1+.25)/9];Math.random=()=>draws.shift()??0;
            q('[data-lesson-id="multiplication-1"]').click();Math.random=saved;q('#lesson-help').click();
            assert(q('#lesson-expression .learn-expression').getAttribute('aria-label')==='8 times 7','single-digit example uses the retained multiplication category');
            assert(q('#step-content .step-operation').getAttribute('aria-label')==='8 × 7','single-digit operation');
            assert(q('#step-content .step-intermediate-result').textContent==='56','single-digit product');
            const refs=[...q('#step-content').querySelectorAll('.digit-highlight')].map(e=>e.dataset.digitRef);
            assert(JSON.stringify(refs)==='["left:0","right:0"]','both single digits highlighted');
            assert(!q('#step-content .carry-route'),'one-product base case needs no carry route');
            assert(q('#step-back').disabled && !q('#step-next').disabled,'single instruction precedes its final answer');
            q('#step-next').click();
            assert(q('#walkthrough .learn-expression').getAttribute('aria-label')==='8 times 7 equals 56','single-digit final answer');
            assert(q('#final-answer').getAttribute('aria-current')==='step' && q('#step-next').disabled,'separate final view remains interactive');
            q('#step-back').click();assert(q('#step-content .step-intermediate-result').textContent==='56','Back returns to the existing multiplication instruction');
            q('#random-example').click();
            const operands=[...q('#lesson-expression').querySelectorAll('.learn-operand')].map(e=>Number(e.textContent));
            assert(operands.every(n=>n>=1&&n<=9) && operands.slice().sort((a,b)=>a-b).join(':')!=='7:8','new example stays single-digit and changes unordered pair');
            assert(q('#step-back').disabled && !q('#step-next').disabled,'new random example resets instruction position');
            assert(q('#step-content .step-intermediate-result').textContent===String(operands[0]*operands[1]),'fresh single-digit instruction arithmetic');
            q('#walkthrough').scrollIntoView({block:'start'});
            return {operands:[8,7],product:56,highlightedDigitRefs:refs,instructionAndSeparateFinal:true,freshExample:operands,resetToFirstInstruction:true};
            """);
        screenshot("android-learn-single-digit.png");
        return result;
    }

    private JSONObject nativeKeyboard() throws Exception {
        js("""
            q('#mode-practice').click(); q('#operation').value='multiplication'; q('#operation').dispatchEvent(new Event('change',{bubbles:true})); q('#digit-count').value='2';
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
        JSONObject rotated = js("assert(window.__rotationMarker==='preserved','JS state survives rotation');assert(document.documentElement.scrollWidth<=innerWidth+1,'landscape has no horizontal clipping');return {problem:q('#answer').dataset.problemId,value:q('#answer').value,time:Number(q('#live-time').textContent)};");
        check(before.getString("problem").equals(rotated.getString("problem")), "Rotation preserves active problem");
        check(before.getString("value").equals(rotated.getString("value")), "Rotation preserves incomplete input");
        check(rotated.getDouble("time") >= before.getDouble("time"), "Rotation preserves live timer progress");
        tapElement("#answer");
        deadline = SystemClock.uptimeMillis() + 8_000;
        while (!imeVisible() && SystemClock.uptimeMillis() < deadline) SystemClock.sleep(100);
        check(imeVisible(), "Native numeric keyboard opens in landscape");
        JSONObject landscape = js("""
            const viewport=visualViewport, answer=q('#answer').getBoundingClientRect(), live=q('#live-time').getBoundingClientRect(), problem=q('#problem').getBoundingClientRect();
            const bottom=(viewport?.offsetTop||0)+(viewport?.height||innerHeight);
            assert(answer.bottom<=bottom+2 && live.bottom<=bottom+2,'landscape answer and timer above keyboard');
            assert(answer.left>=0 && live.right<=innerWidth+1,'landscape answer and timer inside viewport');
            assert(problem.top>=(viewport?.offsetTop||0)-1 && problem.bottom<=bottom+1 && problem.left>=0 && problem.right<=innerWidth+1,'entire landscape question inside visible viewport');
            const separate=(a,b,gap)=>a.right+gap<=b.left || b.right+gap<=a.left || a.bottom+gap<=b.top || b.bottom+gap<=a.top;
            assert(separate(problem,answer,8) && separate(problem,live,4),'landscape question not obscured by answer or timer');
            assert(document.documentElement.scrollWidth<=innerWidth+1,'landscape document width');
            return {width:innerWidth,height:innerHeight,visibleHeight:viewport?.height||innerHeight,answerBottom:answer.bottom,liveBottom:live.bottom,viewportBottom:bottom,problem};
            """);
        layout.put("landscapeKeyboardLayout", landscape);
        screenshot("android-practice-landscape-keyboard.png");
        String firstAnswer = js("q('#answer').value='';q('#answer').dispatchEvent(new Event('input',{bubbles:true}));return {answer:'0'.repeat(String(Number(q('#left-operand').textContent)*Number(q('#right-operand').textContent)).length)};").getString("answer");
        sendStringSync(firstAnswer);
        waitForJs("!document.querySelector('#previous-feedback').hidden", 5_000);
        JSONObject landscapeFeedback = js("""
            const viewport=visualViewport, top=viewport?.offsetTop||0, bottom=top+(viewport?.height||innerHeight);
            const selectors=['#problem','#answer','#live-time','#previous-feedback'];
            const bounds=Object.fromEntries(selectors.map(s=>[s,q(s).getBoundingClientRect()]));
            const separate=(a,b,gap)=>a.right+gap<=b.left || b.right+gap<=a.left || a.bottom+gap<=b.top || b.bottom+gap<=a.top;
            for(const selector of selectors){const b=bounds[selector];assert(b.top>=top-1 && b.bottom<=bottom+1 && b.left>=0 && b.right<=innerWidth+1,'landscape visible bounds '+selector);}
            for(let a=0;a<selectors.length;a++)for(let b=a+1;b<selectors.length;b++)assert(separate(bounds[selectors[a]],bounds[selectors[b]],4),'landscape controls do not overlap '+selectors[a]+' '+selectors[b]);
            assert(separate(bounds['#problem'],bounds['#answer'],8),'question clear of answer focus outline');
            assert(q('#previous-time').textContent && getComputedStyle(q('#previous-time')).color==='rgb(0, 0, 0)','upper-left previous time is visible black');
            assert(q('#previous-feedback').dataset.correct==='false' && !q('#previous-status').hidden && q('#previous-status').textContent==='×','largest incorrect feedback cue is present in short landscape');
            return {width:innerWidth,height:innerHeight,visibleHeight:viewport?.height||innerHeight,bounds};
            """);
        layout.put("landscapeWithPreviousFeedback", landscapeFeedback);
        screenshot("android-practice-landscape-keyboard-feedback.png");
        runOnMainSync(() -> ((InputMethodManager) activity.getSystemService(Activity.INPUT_METHOD_SERVICE))
                .hideSoftInputFromWindow(webView.getWindowToken(), 0));
        runOnMainSync(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        waitOrientation(Configuration.ORIENTATION_PORTRAIT);
        // One deliberately incorrect native submission was made with the landscape keyboard.
        for (int index = 0; index < 9; index++) {
            String answer = js("return {answer:String(Number(q('#left-operand').textContent)*Number(q('#right-operand').textContent))};").getString("answer");
            sendStringSync(answer);
            SystemClock.sleep(25);
        }
        waitForJs("document.querySelector('#score').textContent==='9 / 10'", 5_000);
        layout.put("rotationPreservedState", true);
        layout.put("nativeKeyEventRoundScore", "9 / 10");
        return layout;
    }

    private JSONObject monochromePractice() throws Exception {
        JSONObject result = js("""
            q('#mode-practice').click();q('#operation').value='addition';q('#operation').dispatchEvent(new Event('change',{bubbles:true}));q('#start').click();
            const expected=String(Number(q('#left-operand').textContent)+Number(q('#right-operand').textContent));
            q('#answer').value='0'.repeat(expected.length);q('#answer').dispatchEvent(new Event('input',{bubbles:true}));
            const feedback=q('#previous-feedback'), status=q('#previous-status'), answer=q('#answer');
            assert(feedback.dataset.correct==='false' && status.textContent==='×','explicit black incorrect cue');
            assert(!status.hidden && status.getAttribute('aria-hidden')==='true','decorative visible cue does not replace numeric timing');
            assert(Number.isFinite(Number(q('#previous-time').textContent)) && q('#previous-time').textContent.trim()!=='','previous time remains numeric');
            assert(getComputedStyle(q('#previous-time')).color==='rgb(0, 0, 0)' && getComputedStyle(status).color==='rgb(0, 0, 0)','both incorrect cue and numeric time are black');
            const borderStyle=getComputedStyle(feedback), expectedBorder=parseFloat(borderStyle.getPropertyValue('--border-emphasis'));
            assert(borderStyle.borderTopColor==='rgb(0, 0, 0)' && expectedBorder===2 && Math.abs(parseFloat(borderStyle.borderTopWidth)-expectedBorder)<=1/devicePixelRatio,'incorrect cue has black emphasis border after device-pixel rounding');
            assert(getComputedStyle(answer).backgroundColor==='rgb(255, 255, 255)' && getComputedStyle(answer).color==='rgb(0, 0, 0)','white field and black answer');
            const visible=[...q('#exercise').querySelectorAll('*')].filter(e=>e.getClientRects().length);
            assert(visible.every(e=>getComputedStyle(e).color==='rgb(0, 0, 0)'),'all visible Practice exercise content is black');
            assert(visible.every(e=>['rgba(0, 0, 0, 0)','rgb(0, 0, 0)','rgb(255, 255, 255)','rgb(250, 247, 240)'].includes(getComputedStyle(e).backgroundColor)),'Practice has no instructional-colored background');
            assert(document.documentElement.scrollWidth<=innerWidth+1,'Practice has no horizontal clipping');
            return {incorrectCue:status.textContent,numericTime:q('#previous-time').textContent,feedbackBorder:getComputedStyle(feedback).borderTopWidth,foreground:getComputedStyle(q('#previous-time')).color,answerBackground:getComputedStyle(answer).backgroundColor,visibleElementsChecked:visible.length};
            """);
        screenshot("android-practice-monochrome-incorrect.png");
        js("""
            for(let i=1;i<10;i++){
              q('#answer').value=String(Number(q('#left-operand').textContent)+Number(q('#right-operand').textContent));
              q('#answer').dispatchEvent(new Event('input',{bubbles:true}));
            }
            assert(q('#score').textContent==='9 / 10','monochrome visual check keeps normal round scoring');return {};
            """);
        return result;
    }

    private JSONObject timingRound() throws Exception {
        JSONObject result = js("""
            const actualNow=performance.now.bind(performance); let clock=10000;
            Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});
            q('#operation').value='multiplication'; q('#operation').dispatchEvent(new Event('change',{bubbles:true})); q('#digit-count').value='2'; q('#start').click();
            assert(q('#round-timing').hidden,'summary cleared');
            const durations=[220,530,1499,1499,1499,1499,1499,1499,1499,1499];
            for(let i=0;i<10;i++){
              assert(q('#round-timing').hidden,'summary absent before tenth');
              const id=q('#answer').dataset.problemId;
              const expected=String(Number(q('#left-operand').textContent)*Number(q('#right-operand').textContent));
              clock+=durations[i]; q('#answer').value=i===1?'0'.repeat(expected.length):expected;
              q('#answer').dispatchEvent(new Event('input',{bubbles:true}));
              if(i<9){assert(q('#answer').dataset.problemId!==id,'immediate advance'); assert(document.activeElement===q('#answer'),'answer focus');}
              if(i===1){
                assert(getComputedStyle(q('#previous-time')).color==='rgb(0, 0, 0)','incorrect time black');
                assert(q('#previous-status').textContent==='×' && q('#previous-feedback').dataset.correct==='false','incorrect answer has explicit monochrome cue');
              }
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
            const configurations=[['addition',2],['multiplication',1],['multiplication',2]];
            const setOperation=operation=>{q('#operation').value=operation;q('#operation').dispatchEvent(new Event('change',{bubbles:true}));};
            for(const priorDigits of [1,2]){
              setOperation('multiplication');q('#digit-count').value=String(priorDigits);setOperation('addition');
              assert(q('#digit-count').value==='2','switching to addition resets unsupported length');
              assert(JSON.stringify([...q('#digit-count').options].map(o=>o.value))==='["2"]','only two-digit addition option exists');
            }
            for(const [operation,digits] of configurations){
              setOperation(operation);
              const expectedOptions=operation==='addition'?['2']:['1','2'];
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
            q('#mode-learn').click();assert(JSON.stringify([...q('#lesson-catalog').querySelectorAll('button')].map(b=>b.dataset.lessonId))==='["multiplication-1","multiplication-2"]','Learn remains restricted after all Practice modes');q('#mode-practice').click();
            return {configurations:3,acceptedAnswers:30,allScores:'10 / 10',additionOptions:[2],multiplicationOptions:[1,2],additionSwitchesResetToTwo:true,threeDigitOptionAbsent:true,noAdditionLearn:true};
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
