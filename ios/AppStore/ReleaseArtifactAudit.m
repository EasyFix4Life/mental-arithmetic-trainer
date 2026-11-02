#import <UIKit/UIKit.h>

// External simulator-only verification. This library is injected into a copy of
// the packaged Release app; no app file is changed and no app source is linked.
// It drives the packaged UIKit controls and UITextFieldDelegate directly. It is
// not physical keyboard input or external accessibility/XCUITest automation.
static UIWindow *AuditWindow;
static NSMutableArray<NSString *> *Checks;
static NSMutableSet<NSString *> *Pairs;
static NSString *ExpectedVersion;

static NSArray<UIView *> *Descendants(UIView *view) {
    NSMutableArray *result = [NSMutableArray arrayWithObject:view];
    for (UIView *child in view.subviews) [result addObjectsFromArray:Descendants(child)];
    return result;
}

static UIView *Find(NSString *identifier) {
    for (UIView *view in Descendants(AuditWindow))
        if ([view.accessibilityIdentifier isEqualToString:identifier]) return view;
    return nil;
}

static void Require(BOOL condition, NSString *message) {
    if (!condition) @throw [NSException exceptionWithName:@"ReleaseArtifactAudit" reason:message userInfo:nil];
    [Checks addObject:message];
}

static void Write(NSString *name, NSDictionary *result) {
    NSString *directory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
    NSData *data = [NSJSONSerialization dataWithJSONObject:result options:NSJSONWritingPrettyPrinted | NSJSONWritingSortedKeys error:nil];
    [data writeToFile:[directory stringByAppendingPathComponent:name] atomically:YES];
}

static void Report(NSString *error) {
    Write(@"qa-release-artifact-audit.json", @{
        @"status": error ? @"failed" : @"passed", @"error": error ?: (id)[NSNull null],
        @"kind": @"external-simulator-library-driving-packaged-release-controls",
        @"version": [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"] ?: @"unknown",
        @"build": [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"] ?: @"unknown",
        @"systemVersion": UIDevice.currentDevice.systemVersion,
        @"checks": Checks ?: @[], @"passedChecks": @(Checks.count),
        @"limitations": @[@"UIKit control actions and text-field delegates; not physical keyboard or external XCUITest automation",
                             @"Audit dylib is external to the unchanged downloaded app bundle"]
    });
}

static void Later(double seconds, dispatch_block_t action) {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(seconds * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        @try { action(); } @catch (NSException *error) { Report(error.reason); }
    });
}

static NSString *Expression(void) { return Find(@"practice-problem").accessibilityLabel; }
static NSArray<NSNumber *> *Numbers(NSString *expression) {
    NSMutableArray *values = [NSMutableArray new];
    for (NSString *fragment in [expression componentsSeparatedByCharactersInSet:NSCharacterSet.decimalDigitCharacterSet.invertedSet])
        if (fragment.length) [values addObject:@(fragment.integerValue)];
    return values;
}
static NSString *Answer(NSString *expression) {
    NSArray<NSNumber *> *values = Numbers(expression);
    Require(values.count == 2, @"Expression contains exactly two operands");
    NSInteger first = values[0].integerValue, second = values[1].integerValue;
    return [NSString stringWithFormat:@"%ld", (long)([expression containsString:@"times"] ? first * second : first + second)];
}
static void Press(NSString *identifier) {
    UIButton *button = (UIButton *)Find(identifier);
    Require([button isKindOfClass:UIButton.class] && button.enabled, [@"Enabled button: " stringByAppendingString:identifier]);
    [button sendActionsForControlEvents:UIControlEventTouchUpInside];
    [AuditWindow layoutIfNeeded];
}
static NSArray<NSString *> *DigitTitles(void) {
    UISegmentedControl *digits = (UISegmentedControl *)Find(@"digit-count-control");
    NSMutableArray *result = [NSMutableArray new];
    for (NSInteger index = 0; index < digits.numberOfSegments; index++) [result addObject:[digits titleForSegmentAtIndex:index]];
    return result;
}
static void Select(NSString *identifier, NSInteger index) {
    UISegmentedControl *control = (UISegmentedControl *)Find(identifier);
    Require(index >= 0 && index < control.numberOfSegments, [@"Available selection: " stringByAppendingString:identifier]);
    control.selectedSegmentIndex = index;
    [control sendActionsForControlEvents:UIControlEventValueChanged];
    [AuditWindow layoutIfNeeded];
}
static void Edit(NSString *inserted) {
    UITextField *field = (UITextField *)Find(@"answer-field");
    NSString *original = field.text ?: @"";
    BOOL allow = [field.delegate textField:field shouldChangeCharactersInRange:NSMakeRange(original.length, 0) replacementString:inserted];
    if (allow) field.text = [original stringByAppendingString:inserted];
    [AuditWindow layoutIfNeeded];
}

static void CheckMultiplication(NSInteger digits) {
    Select(@"operation-control", 1);
    Require([DigitTitles() isEqualToArray:@[@"1", @"2", @"3"]], @"All multiplication choices remain available after a completed round");
    Select(@"digit-count-control", digits - 1);
    Press(@"practice-start");
    NSMutableSet *seen = [NSMutableSet new];
    for (NSInteger index = 0; index < 10; index++) {
        NSString *expression = Expression();
        NSArray<NSNumber *> *values = Numbers(expression);
        Require(values.count == 2 && [values[0] stringValue].length == digits && [values[1] stringValue].length == digits
                && [expression containsString:@"times"], [NSString stringWithFormat:@"Multiplication %ld uses the requested operand size", (long)digits]);
        NSString *key = [NSString stringWithFormat:@"%@,%@", values[0].integerValue <= values[1].integerValue ? values[0] : values[1], values[0].integerValue <= values[1].integerValue ? values[1] : values[0]];
        Require(![seen containsObject:key], @"Multiplication round has no reversed duplicates");
        [seen addObject:key];
        Edit(Answer(expression));
        if (index < 9) Require(![Expression() isEqualToString:expression], @"Multiplication accepts the answer and advances immediately");
    }
    Require([[(UILabel *)Find(@"round-score") text] isEqualToString:@"10 / 10"], [NSString stringWithFormat:@"Multiplication %ld completes ten correct answers", (long)digits]);
    if (digits < 3) { CheckMultiplication(digits + 1); return; }
    Press(@"privacy-policy");
    Later(0.3, ^{
        NSString *policy = [(UITextView *)Find(@"privacy-policy-text") text];
        Require([policy containsString:@"does not collect personal data"], @"Existing Privacy sheet opens");
        if ([ExpectedVersion isEqualToString:@"1.1.3"])
            Require([policy containsString:@"Version 1.1.3 (build 4)"], @"Privacy displays the installed version and build");
        Report(nil);
    });
}

static void CheckLessons(void) {
    NSString *score = [(UILabel *)Find(@"round-score") text];
    Require([score isEqualToString:@"9 / 10"], @"Ten-question score is nine correct and one incorrect");
    double minimum = [(UILabel *)Find(@"minimum-time") text].doubleValue;
    double maximum = [(UILabel *)Find(@"maximum-time") text].doubleValue;
    double average = [(UILabel *)Find(@"average-time") text].doubleValue;
    Require(minimum >= 0.1 && minimum <= average && average <= maximum, @"Completed round retains minimum, maximum and average timing");
    Select(@"mode-control", 0);
    Require([[(UILabel *)Find(@"lesson-title") text] isEqualToString:@"Two-digit addition"], @"Learn defaults to two-digit addition");
    Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"catalog"});
    Later(0.8, ^{
        NSMutableArray *catalog = [NSMutableArray new];
        for (UIView *view in Descendants(AuditWindow))
            if ([view isKindOfClass:UIButton.class] && [view.accessibilityIdentifier hasPrefix:@"lesson-"] && ![view.accessibilityIdentifier isEqualToString:@"lesson-help"])
                [catalog addObject:view.accessibilityIdentifier];
        Require([catalog isEqualToArray:@[@"lesson-multiplication-1", @"lesson-addition-2", @"lesson-multiplication-2", @"lesson-multiplication-3"]], @"Learn exposes exactly M1, A2, M2, M3; no A1 or A3");
        for (NSString *identifier in catalog) {
            Press(identifier);
            NSString *original = Find(@"lesson-expression").accessibilityLabel;
            Press(@"random-example");
            NSString *fresh = Find(@"lesson-expression").accessibilityLabel;
            Require(![fresh isEqualToString:original], [@"Fresh random example: " stringByAppendingString:identifier]);
            NSString *answer = Answer(fresh);
            Press(@"lesson-help");
            Require(Find(@"step-operation") != nil, [@"Instructional calculation: " stringByAppendingString:identifier]);
            Press(@"final-answer");
            Require([Find(@"final-answer-expression").accessibilityLabel hasSuffix:[@"equals " stringByAppendingString:answer]], [@"Correct instructional final answer: " stringByAppendingString:identifier]);
        }
        Select(@"mode-control", 1);
        Require([[(UILabel *)Find(@"round-score") text] isEqualToString:score], @"Practice results survive the Learn visit");
        CheckMultiplication(1);
    });
}

static void AnswerNext(NSInteger index) {
    NSString *expression = Expression();
    NSArray<NSNumber *> *numbers = Numbers(expression);
    Require(numbers.count == 2 && numbers[0].integerValue >= 10 && numbers[0].integerValue <= 99
            && numbers[1].integerValue >= 10 && numbers[1].integerValue <= 99, @"Practice addition uses two-digit operands");
    NSString *key = [NSString stringWithFormat:@"%@,%@", numbers[0].integerValue <= numbers[1].integerValue ? numbers[0] : numbers[1], numbers[0].integerValue <= numbers[1].integerValue ? numbers[1] : numbers[0]];
    Require(![Pairs containsObject:key], @"Practice pair is unique even when reversed");
    [Pairs addObject:key];
    NSString *answer = Answer(expression);
    if (index == 0) {
        Edit([answer substringToIndex:answer.length - 1]);
        Require([Expression() isEqualToString:expression], @"Partial answer does not submit");
        UITextField *field = (UITextField *)Find(@"answer-field");
        Require(![field.delegate textFieldShouldReturn:field], @"Return does not submit");
        Edit([answer substringFromIndex:answer.length - 1]);
    } else Edit(index == 1 ? [@"" stringByPaddingToLength:answer.length withString:@"0" startingAtIndex:0] : answer);
    if (index < 9) {
        Require(![Expression() isEqualToString:expression], @"Submission immediately advances");
        UIColor *color = [(UILabel *)Find(@"previous-time") textColor];
        if (index == 0) Require([color isEqual:UIColor.blackColor], @"Correct completion time is black");
        if (index == 1) { CGFloat r,g,b,a; [color getRed:&r green:&g blue:&b alpha:&a]; Require(r > g && r > b, @"Incorrect completion time is red"); }
        Later(0.16, ^{ AnswerNext(index + 1); });
    } else CheckLessons();
}

static void Begin(void) {
    Checks = [NSMutableArray new]; Pairs = [NSMutableSet new];
    ExpectedVersion = NSProcessInfo.processInfo.environment[@"RELEASE_AUDIT_EXPECT_VERSION"];
    Require([[NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"] isEqualToString:ExpectedVersion], @"Running the expected packaged Release version");
    Require([DigitTitles() isEqualToArray:@[@"2"]], @"Addition starts with only digit choice 2");
    Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"setup"});
    Later(0.8, ^{
        for (NSNumber *prior in @[@0, @2]) {
            Select(@"operation-control", 1);
            Require([DigitTitles() isEqualToArray:@[@"1", @"2", @"3"]], @"Multiplication retains all three digit choices");
            Select(@"digit-count-control", prior.integerValue);
            Select(@"operation-control", 0);
            Require([DigitTitles() isEqualToArray:@[@"2"]] && [(UISegmentedControl *)Find(@"digit-count-control") selectedSegmentIndex] == 0, @"Switching M1 or M3 to addition selects only A2");
        }
        Press(@"practice-start");
        Later(0.16, ^{ AnswerNext(0); });
    });
}

__attribute__((constructor)) static void LoadAudit(void) {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC), dispatch_get_main_queue(), ^{
        @try {
            for (UIScene *scene in UIApplication.sharedApplication.connectedScenes)
                if ([scene isKindOfClass:UIWindowScene.class])
                    for (UIWindow *window in ((UIWindowScene *)scene).windows)
                        if (window.rootViewController && window.windowLevel == UIWindowLevelNormal) AuditWindow = window;
            Require(AuditWindow != nil, @"Native app window exists");
            Begin();
        } @catch (NSException *error) { Report(error.reason); }
    });
}
