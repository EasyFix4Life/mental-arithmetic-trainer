#import <UIKit/UIKit.h>

// External simulator-only verification. This library is injected into a copy of
// the packaged Release app; no app file is changed and no app source is linked.
// It drives the packaged UIKit controls and UITextFieldDelegate directly. It is
// not physical keyboard input or external accessibility/XCUITest automation.
static UIWindow *AuditWindow;
static NSMutableArray<NSString *> *Checks;
static NSMutableSet<NSString *> *Pairs;
static NSString *ExpectedVersion;
static NSString *ExpectedBuild;
static NSString *AuditScope;

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

static NSString *ColorCode(UIColor *color) {
    CGFloat r,g,b,a; if (![color getRed:&r green:&g blue:&b alpha:&a]) return @"unknown";
    return [NSString stringWithFormat:@"#%02X%02X%02X", (int)lround(r*255), (int)lround(g*255), (int)lround(b*255)];
}

static BOOL IsBlack(UIColor *color) {
    CGFloat r,g,b,a; return [color getRed:&r green:&g blue:&b alpha:&a] && r==0 && g==0 && b==0 && a==1;
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
        @"scope": AuditScope ?: @"full",
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

static BOOL CompletePairBracket(void) {
    UIView *connector = Find(@"pair-connector");
    for (CALayer *layer in connector.layer.sublayers) {
        if ([layer isKindOfClass:CAShapeLayer.class]) {
            CAShapeLayer *stroke = (CAShapeLayer *)layer;
            CGRect box = CGPathGetBoundingBox(stroke.path);
            if (box.size.width > 20 && box.size.height >= 10 &&
                [ColorCode([UIColor colorWithCGColor:stroke.strokeColor]) isEqualToString:@"#755093"]) return YES;
        }
    }
    return NO;
}

static void CheckLiteralHeader(void);

static void CheckGroupedStages(NSString *answer) {
    UIView *product = Find(@"stage-product-group");
    UIView *middle = Find(@"stage-middle-group");
    UIButton *final = (UIButton *)Find(@"final-answer");
    UILabel *plus = (UILabel *)Find(@"stage-middle-plus");
    UILabel *equals = (UILabel *)Find(@"stage-equals");
    Require(product && middle && [middle isDescendantOfView:product], @"Named stages have an outer enclosure and nested middle section");
    Require([plus.text isEqualToString:@"+"] && [plus isDescendantOfView:middle], @"Middle section contains the explicit plus sign");
    Require([Find(@"stage-inside") isDescendantOfView:middle] && [Find(@"stage-outside") isDescendantOfView:middle], @"Inside and Outside remain discrete middle controls");
    Require(![final isDescendantOfView:product] && ![equals isDescendantOfView:product] && [equals.text isEqualToString:@"="], @"Equals and Final Answer stay outside the stage enclosure");
    for (UILabel *glyph in @[plus, equals])
        Require(glyph.bounds.size.width >= [glyph.text sizeWithAttributes:@{NSFontAttributeName:glyph.font}].width-1, @"Plus and equals glyphs remain fully visible");
    Require(!product.isAccessibilityElement && !middle.isAccessibilityElement, @"Group containers do not collapse accessible controls");
    NSArray *outerActions = product.accessibilityElements;
    Require([outerActions isEqualToArray:@[Find(@"stage-first"), middle, Find(@"stage-last")]] &&
            [middle.accessibilityElements isEqualToArray:@[Find(@"stage-inside"), Find(@"stage-outside")]], @"Accessible order is First Inside Outside Last then separate Final Answer");
    NSDictionary *fills = @{@"first": @"#E2F1EF", @"inside": @"#EEE5F4", @"outside": @"#EEE5F4", @"last": @"#F6ECD8"};
    UIFont *firstFont = nil;
    NSDirectionalEdgeInsets firstInsets = NSDirectionalEdgeInsetsZero;
    for (NSString *stage in @[@"first", @"inside", @"outside", @"last"]) {
        UIButton *button = (UIButton *)Find([@"stage-" stringByAppendingString:stage]);
        Require(button.layer.borderWidth == 2 && button.bounds.size.height >= 44, @"Each named stage has equal two-point border and accessible target");
        Require([ColorCode(button.backgroundColor) isEqualToString:fills[stage]], [@"Light matching stage fill: " stringByAppendingString:stage]);
        UIFont *font = [button.titleLabel.attributedText attribute:NSFontAttributeName atIndex:0 effectiveRange:nil] ?: button.titleLabel.font;
        Require([font.fontName containsString:@"Baskerville"] && [font.fontName containsString:@"Bold"], @"Every named stage uses bold scholarly text");
        Require(button.titleLabel.attributedText.size.width <= button.titleLabel.bounds.size.width+1, @"Each named stage is a complete readable word in this layout");
        if (!firstFont) { firstFont = font; firstInsets = button.configuration.contentInsets; }
        else {
            NSDirectionalEdgeInsets insets = button.configuration.contentInsets;
            Require([font.fontName isEqualToString:firstFont.fontName] && fabs(font.pointSize-firstFont.pointSize)<0.1 &&
                    insets.top==firstInsets.top && insets.leading==firstInsets.leading && insets.bottom==firstInsets.bottom && insets.trailing==firstInsets.trailing,
                    @"Named stage font, size and padding have equal prominence");
        }
    }
    Require([final.accessibilityLabel isEqualToString:[@"Final Answer: " stringByAppendingString:answer]], @"Final box preserves requested caption casing");
    NSAttributedString *caption = final.titleLabel.attributedText;
    NSRange digits = [caption.string rangeOfString:answer options:NSBackwardsSearch];
    Require(digits.location != NSNotFound && [[(UIFont *)[caption attribute:NSFontAttributeName atIndex:digits.location effectiveRange:nil] fontName] containsString:@"Arial"], @"Final box digits preserve Arial");
    for (NSString *identifier in @[@"stage-connection-first", @"stage-connection-last"]) {
        UILabel *arrow = (UILabel *)Find(identifier);
        Require([arrow.text isEqualToString:@"&"] && CGAffineTransformIsIdentity(arrow.transform) && !arrow.isAccessibilityElement, @"Literal upright ampersands visually connect the stages");
    }
    CheckLiteralHeader();
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

static void CheckPrivacy(void) {
    Press(@"privacy-policy");
    Later(0.3, ^{
        NSString *policy = [(UITextView *)Find(@"privacy-policy-text") text];
        Require([policy containsString:@"does not collect personal data"], @"Existing Privacy sheet opens");
        Require([policy containsString:[NSString stringWithFormat:@"Version %@ (build %@)", ExpectedVersion, [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"]]], @"Privacy displays the installed version and build");
        Report(nil);
    });
}

static void CheckEnlargedPractice(void) {
    Select(@"operation-control", 0);
    Press(@"practice-start");
    AuditWindow.traitOverrides.preferredContentSizeCategory = UIContentSizeCategoryAccessibilityExtraExtraExtraLarge;
    Later(0.4, ^{
        NSString *answer = Answer(Expression());
        Edit([@"" stringByPaddingToLength:answer.length withString:@"0" startingAtIndex:0]);
        Later(0.4, ^{
            UIView *problem = Find(@"practice-problem"), *field = Find(@"answer-field"), *timer = Find(@"live-time"), *previous = Find(@"previous-time");
            CGRect mathRect = [problem convertRect:problem.bounds toView:AuditWindow];
            CGRect fieldRect = [field convertRect:field.bounds toView:AuditWindow];
            CGRect timerRect = [timer convertRect:timer.bounds toView:AuditWindow];
            CGRect previousRect = [previous convertRect:previous.bounds toView:AuditWindow];
            Require(CGRectGetMaxY(mathRect) <= CGRectGetMinY(fieldRect)+1 && CGRectGetMinY(mathRect) >= CGRectGetMaxY(previousRect)-1, @"Release largest-text Practice keeps mathematics between feedback and answer");
            Require(CGRectGetMinX(fieldRect)>=0 && CGRectGetMaxX(timerRect)<=AuditWindow.bounds.size.width+1, @"Release largest-text answer and timer fit the viewport");
            Require(IsBlack([(UILabel *)previous textColor]) && IsBlack([(UILabel *)Find(@"previous-incorrect-cue") textColor]), @"Release largest-text incorrect feedback stays monochrome");
            Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"practice-accessibility"});
            Later(2.0, ^{
                for (NSInteger index=1; index<10; index++) Edit(Answer(Expression()));
                Require([[(UILabel *)Find(@"round-score") text] isEqualToString:@"9 / 10"], @"Largest-text Practice still completes ten answers with unchanged scoring");
                AuditWindow.traitOverrides.preferredContentSizeCategory = UIContentSizeCategoryLarge;
                [AuditWindow layoutIfNeeded];
                CheckPrivacy();
            });
        });
    });
}

static void CheckEnlargedGroupedStages(NSString *answer, dispatch_block_t finished) {
    AuditWindow.traitOverrides.preferredContentSizeCategory = UIContentSizeCategoryAccessibilityExtraExtraExtraLarge;
    [AuditWindow layoutIfNeeded];
    Later(0.4, ^{
        CheckGroupedStages(answer);
        Require([(UIStackView *)Find(@"stage-middle-group") axis] == UILayoutConstraintAxisVertical, @"Release largest-text middle pair stacks within its existing outline");
        UILabel *heading = (UILabel *)Find(@"walkthrough-heading");
        Require([@"Instructional" sizeWithAttributes:@{NSFontAttributeName: heading.font}].width <= heading.bounds.size.width+1, @"Release largest-text walkthrough heading preserves whole words");
        for (NSString *identifier in @[@"stage-first", @"stage-inside", @"stage-outside", @"stage-last", @"final-answer"]) {
            UIButton *button = (UIButton *)Find(identifier);
            CGRect frame = [button convertRect:button.bounds toView:AuditWindow];
            Require(CGRectGetMinX(frame)>=0 && CGRectGetMaxX(frame)<=AuditWindow.bounds.size.width+1, @"Release largest-text stage/final box stays within readable width");
            CGSize needed = [button.titleLabel sizeThatFits:CGSizeMake(button.titleLabel.bounds.size.width, CGFLOAT_MAX)];
            Require(button.titleLabel.bounds.size.height >= needed.height-1, @"Release largest-text stage/final caption is not clipped");
            if (![identifier isEqualToString:@"final-answer"])
                Require(button.titleLabel.attributedText.size.width <= button.titleLabel.bounds.size.width+1, @"Release largest-text stage label remains a whole word");
        }
        Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"grouped-accessibility"});
        Later(2.0, ^{
            AuditWindow.traitOverrides.preferredContentSizeCategory = UIContentSizeCategoryLarge;
            [AuditWindow layoutIfNeeded];
            finished();
        });
    });
}

static void CheckMultiplication(NSInteger digits) {
    Select(@"operation-control", 1);
    Require([DigitTitles() isEqualToArray:@[@"1", @"2"]], @"Only one- and two-digit multiplication choices remain available after a completed round");
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
    if (digits < 2) { CheckMultiplication(digits + 1); return; }
    CheckEnlargedPractice();
}

static void CheckLessons(void) {
    NSString *score = [(UILabel *)Find(@"round-score") text];
    Require([score isEqualToString:@"9 / 10"], @"Ten-question score is nine correct and one incorrect");
    Require([[(UILabel *)Find(@"round-score") font].fontName containsString:@"Arial"], @"Score numerals use Arial");
    for (NSString *identifier in @[@"maximum-time", @"minimum-time", @"average-time"])
        Require([[(UILabel *)Find(identifier) font].fontName containsString:@"Arial"] && IsBlack([(UILabel *)Find(identifier) textColor]), @"Timing statistics use black Arial numerals");
    double minimum = [(UILabel *)Find(@"minimum-time") text].doubleValue;
    double maximum = [(UILabel *)Find(@"maximum-time") text].doubleValue;
    double average = [(UILabel *)Find(@"average-time") text].doubleValue;
    Require(minimum >= 0.1 && minimum <= average && average <= maximum, @"Completed round retains minimum, maximum and average timing");
    Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"addition-results"});
    Later(2.0, ^{
    Select(@"mode-control", 0);
    Require([[(UILabel *)Find(@"lesson-title") text] isEqualToString:@"Single-digit multiplication"], @"Learn defaults to the first available single-digit multiplication lesson");
    Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"catalog"});
    Later(2.0, ^{
        NSMutableArray *catalog = [NSMutableArray new];
        for (UIView *view in Descendants(AuditWindow))
            if ([view isKindOfClass:UIButton.class] && [view.accessibilityIdentifier hasPrefix:@"lesson-"] && ![view.accessibilityIdentifier isEqualToString:@"lesson-help"])
                [catalog addObject:view.accessibilityIdentifier];
        Require([catalog isEqualToArray:@[@"lesson-multiplication-1", @"lesson-multiplication-2"]], @"Learn exposes exactly M1 and M2, with no addition or three-digit multiplication");
        for (NSString *identifier in @[@"lesson-addition-1", @"lesson-addition-2", @"lesson-addition-3", @"lesson-multiplication-3"])
            Require(Find(identifier)==nil, [@"Removed Learn option is absent: " stringByAppendingString:identifier]);
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
            if ([identifier isEqualToString:@"lesson-multiplication-2"]) {
                CheckGroupedStages(answer);
                for (NSString *stage in @[@"first", @"inside", @"outside", @"last"]) {
                    Press([@"stage-" stringByAppendingString:stage]);
                    CheckGroupedStages(answer);
                }
                for (NSInteger step=0; step<10 && !Find(@"final-answer-expression"); step++) Press(@"step-next");
                Require(Find(@"final-answer-expression") != nil, @"Release Next follows the original carry screens to Final Answer");
                Press(@"step-back"); Require(Find(@"step-intermediate-result") != nil, @"Release Back returns from Final Answer to the last existing instruction");
                Press(@"step-next"); Require(Find(@"final-answer-expression") != nil, @"Release Next returns to the final answer");
            } else Require(Find(@"stage-product-group") == nil, @"Numbered lessons retain their existing generic navigation");
        }
        Press(@"lesson-multiplication-2");
        NSArray<NSNumber *> *digits;
        NSInteger a, b, c, d;
        for (NSInteger attempt = 0; ; attempt++) {
            digits = Numbers(Find(@"lesson-expression").accessibilityLabel);
            Require(digits.count == 2, @"Two-digit multiplication example has two operands");
            a = digits[0].integerValue / 10; b = digits[0].integerValue % 10;
            c = digits[1].integerValue / 10; d = digits[1].integerValue % 10;
            if (b * c != a * d) break;
            Require(attempt < 20, @"A varied random example distinguishes the cross-products");
            Press(@"random-example");
        }
        Press(@"lesson-help");
        Press(@"stage-inside");
        NSString *insideLabel = Find(@"instruction-expression").accessibilityLabel;
        Require([insideLabel containsString:[NSString stringWithFormat:@"left operand, position 2, digit %ld", (long)b]] &&
                [insideLabel containsString:[NSString stringWithFormat:@"right operand, position 1, digit %ld", (long)c]], @"Inside highlights the two inner digits");
        Require([[(UILabel *)Find(@"step-operation") text] isEqualToString:[NSString stringWithFormat:@"%ld × %ld", (long)b, (long)c]], @"Inside calculation multiplies left units by right tens");
        Require([[(UILabel *)Find(@"step-intermediate-result") text] integerValue] == b * c, @"Inside gives the inner-digit product");
        UILabel *insideGlyphs;
        for (UIView *view in Descendants(Find(@"instruction-expression")))
            if ([view isKindOfClass:UILabel.class] && [(UILabel *)view attributedText]) insideGlyphs = (UILabel *)view;
        Require([ColorCode([insideGlyphs.attributedText attribute:NSForegroundColorAttributeName atIndex:1 effectiveRange:nil]) isEqualToString:@"#755093"], @"Inside left inner digit uses canonical muted violet");
        Require([ColorCode([insideGlyphs.attributedText attribute:NSForegroundColorAttributeName atIndex:5 effectiveRange:nil]) isEqualToString:@"#755093"], @"Inside right inner digit uses the same violet");
        Require([[(UILabel *)Find(@"stage-heading") font].fontName containsString:@"Baskerville"], @"Instruction heading uses scholarly Baskerville");
        Require([[(UIFont *)[insideGlyphs.attributedText attribute:NSFontAttributeName atIndex:0 effectiveRange:nil] fontName] containsString:@"Arial"], @"Equation numerals preserve Arial");
        Require(CompletePairBracket(), @"Inside complete static violet pair bracket is packaged");
        CheckGroupedStages(Answer(Find(@"lesson-expression").accessibilityLabel));
        Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"inside-corrected"});
        Later(2.0, ^{
            Press(@"stage-outside");
            NSString *outsideLabel = Find(@"instruction-expression").accessibilityLabel;
            Require([outsideLabel containsString:[NSString stringWithFormat:@"left operand, position 1, digit %ld", (long)a]] &&
                    [outsideLabel containsString:[NSString stringWithFormat:@"right operand, position 2, digit %ld", (long)d]], @"Outside highlights the two outer digits");
            Require([Find(@"step-operation").accessibilityLabel isEqualToString:[NSString stringWithFormat:@"%ld times %ld", (long)a, (long)d]], @"Outside calculation multiplies left tens by right units");
            Require([[(UILabel *)Find(@"step-intermediate-result") text] integerValue] == b * c + a * d, @"Outside combines the corrected Inside and Outside products");
            Require([[(UILabel *)Find(@"step-narration") text] isEqualToString:[NSString stringWithFormat:@"Combine Inside and Outside: %ld + %ld = %ld.", (long)(b * c), (long)(a * d), (long)(b * c + a * d)]], @"Narration follows Inside then Outside");
            UILabel *outsideGlyphs;
            for (UIView *view in Descendants(Find(@"instruction-expression")))
                if ([view isKindOfClass:UILabel.class] && [(UILabel *)view attributedText]) outsideGlyphs = (UILabel *)view;
            Require([ColorCode([outsideGlyphs.attributedText attribute:NSForegroundColorAttributeName atIndex:0 effectiveRange:nil]) isEqualToString:@"#755093"], @"Outside left outer digit uses canonical muted violet");
            Require([ColorCode([outsideGlyphs.attributedText attribute:NSForegroundColorAttributeName atIndex:6 effectiveRange:nil]) isEqualToString:@"#755093"], @"Outside right outer digit uses the same violet");
            Require(CompletePairBracket(), @"Outside complete static violet pair bracket is packaged");
            CheckGroupedStages(Answer(Find(@"lesson-expression").accessibilityLabel));
            Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"outside-corrected"});
            Later(2.0, ^{
                CheckEnlargedGroupedStages(Answer(Find(@"lesson-expression").accessibilityLabel), ^{
                    Select(@"mode-control", 1);
                    Require([[(UILabel *)Find(@"round-score") text] isEqualToString:score], @"Practice results survive the Learn visit");
                    CheckMultiplication(1);
                });
            });
        });
    });
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
        if (index == 0) {
            Require(IsBlack(color), @"Correct completion time is black");
            Require([ColorCode([(UITextField *)Find(@"answer-field") backgroundColor]) isEqualToString:@"#FFFFFF"], @"Answer field is white");
            Require([[(UITextField *)Find(@"answer-field") font].fontName containsString:@"Arial"], @"Answer entry retains Arial");
        }
        if (index == 1) {
            UILabel *cue = (UILabel *)Find(@"previous-incorrect-cue");
            Require(IsBlack(color) && IsBlack(cue.textColor), @"Incorrect completion time and cue are black");
            Require(!cue.hidden && [cue.text isEqualToString:@"×"] && Find(@"previous-time").superview.layer.borderWidth == 2, @"Incorrect feedback has a black cross and border");
        }
        Later(0.16, ^{ AnswerNext(index + 1); });
    } else CheckLessons();
}

// Focused preview-3 regression: only the two decorative header connectors changed.
// Carry routes and arithmetic continue to use their existing presentation.
static void ScrollToHeaderPart(NSString *identifier) {
    UIView *target = Find(identifier);
    UIScrollView *scroll;
    for (UIView *ancestor = target.superview; ancestor; ancestor = ancestor.superview)
        if ([ancestor isKindOfClass:UIScrollView.class]) { scroll = (UIScrollView *)ancestor; break; }
    Require(scroll != nil, @"Header remains in scrollable instructional content");
    CGRect rect = [target convertRect:target.bounds toView:scroll];
    CGFloat maximum = MAX(0, scroll.contentSize.height-scroll.bounds.size.height+scroll.adjustedContentInset.bottom);
    [scroll setContentOffset:CGPointMake(0, MIN(maximum, MAX(0, rect.origin.y-16))) animated:NO];
    [AuditWindow layoutIfNeeded];
}

static void CheckLiteralHeader(void) {
    UIView *product = Find(@"stage-product-group");
    NSInteger ampersands = 0, arrows = 0;
    NSCharacterSet *arrowCharacters = [NSCharacterSet characterSetWithCharactersInString:@"→↓←↑"];
    for (UIView *view in Descendants(product)) {
        if (![view isKindOfClass:UILabel.class]) continue;
        UILabel *label = (UILabel *)view;
        if ([label.text isEqualToString:@"&"]) ampersands++;
        if ([label.text rangeOfCharacterFromSet:arrowCharacters].location != NSNotFound) arrows++;
    }
    Require(ampersands == 2 && arrows == 0, @"Header contains exactly two literal ampersands and no connection arrows");
    for (NSString *identifier in @[@"stage-connection-first", @"stage-connection-last"]) {
        UILabel *label = (UILabel *)Find(identifier);
        Require([label.text isEqualToString:@"&"] && CGAffineTransformIsIdentity(label.transform) && CATransform3DIsIdentity(label.layer.transform), @"Header ampersand is literal and upright without rotation or transforms");
        Require(label.bounds.size.width >= [@"&" sizeWithAttributes:@{NSFontAttributeName:label.font}].width-1, @"Header ampersand has enough measured width for its actual font");
    }
    UIButton *final = (UIButton *)Find(@"final-answer");
    CGSize needed = [final.titleLabel sizeThatFits:CGSizeMake(final.titleLabel.bounds.size.width, CGFLOAT_MAX)];
    Require(final.titleLabel.bounds.size.height >= needed.height-1, @"Final Answer caption has sufficient height without clipping");
}

static void FinishAmpersandEnlarged(void) {
    AuditWindow.traitOverrides.preferredContentSizeCategory = UIContentSizeCategoryAccessibilityExtraExtraExtraLarge;
    [AuditWindow layoutIfNeeded];
    Later(0.4, ^{
        Press(@"stage-inside");
        CheckGroupedStages(Answer(Find(@"lesson-expression").accessibilityLabel));
        CheckLiteralHeader();
        Require([(UIStackView *)Find(@"stage-product-group") axis] == UILayoutConstraintAxisVertical && [(UIStackView *)Find(@"stage-middle-group") axis] == UILayoutConstraintAxisVertical, @"Largest accessibility text stacks the outer and middle groups while preserving both ampersands");
        for (NSString *identifier in @[@"stage-first", @"stage-inside", @"stage-outside", @"stage-last", @"final-answer"]) {
            UIView *view = Find(identifier);
            CGRect rect = [view convertRect:view.bounds toView:AuditWindow];
            Require(CGRectGetMinX(rect)>=0 && CGRectGetMaxX(rect)<=AuditWindow.bounds.size.width+1, @"Largest-text stage and final controls fit the viewport width");
        }
        ScrollToHeaderPart(@"stage-middle-group");
        Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"largest-middle"});
        Later(2.0, ^{
            Press(@"final-answer");
            CheckGroupedStages(Answer(Find(@"lesson-expression").accessibilityLabel));
            CheckLiteralHeader();
            ScrollToHeaderPart(@"stage-last");
            Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"largest-final"});
            Later(2.0, ^{
                AuditWindow.traitOverrides.preferredContentSizeCategory = UIContentSizeCategoryLarge;
                [AuditWindow layoutIfNeeded];
                CheckGroupedStages(Answer(Find(@"lesson-expression").accessibilityLabel));
                CheckLiteralHeader();
                Press(@"final-answer");
                ScrollToHeaderPart(@"stage-product-group");
                Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"normal-final"});
                Later(2.0, ^{ Report(nil); });
            });
        });
    });
}

static void CheckAmpersandCarry(void) {
    NSArray<NSNumber *> *values = Numbers(Find(@"lesson-expression").accessibilityLabel);
    NSInteger attempts=0;
    while ((values[0].integerValue % 10)*(values[1].integerValue % 10)<10 && attempts++<100) {
        Press(@"random-example");
        values = Numbers(Find(@"lesson-expression").accessibilityLabel);
    }
    NSInteger carry = ((values[0].integerValue % 10)*(values[1].integerValue % 10))/10;
    Require(carry>0, @"An actual random example supplies a Last-to-middle carry");
    Press(@"stage-last");
    Require(Find(@"carry-route") != nil, @"Existing carry route remains present on the actual Last step");
    NSInteger matchingRoutes=0;
    for (UIView *view in Descendants(Find(@"carry-route"))) {
        if (![view isKindOfClass:UILabel.class] || ![view.accessibilityIdentifier isEqualToString:@"carry-route-value"]) continue;
        UILabel *route=(UILabel *)view;
        Require([route.text containsString:@"↓"] && ![route.text containsString:@"&"], @"Carry-route down arrows remain unchanged");
        if ([route.text isEqualToString:[NSString stringWithFormat:@"↓  %ld  ↓", (long)carry]]) matchingRoutes++;
    }
    Require(matchingRoutes==1, @"Carry route preserves the whole actual carried value");
    CheckGroupedStages(Answer(Find(@"lesson-expression").accessibilityLabel));
    CheckLiteralHeader();
    ScrollToHeaderPart(@"stage-product-group");
    Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"carry-route"});
    Later(2.0, ^{ FinishAmpersandEnlarged(); });
}

static void BeginAmpersandHeader(void) {
    Checks=[NSMutableArray new]; Pairs=[NSMutableSet new];
    ExpectedVersion=NSProcessInfo.processInfo.environment[@"RELEASE_AUDIT_EXPECT_VERSION"];
    Require([[NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"] isEqualToString:ExpectedVersion] && [[NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"] isEqualToString:ExpectedBuild], @"Running the expected packaged Release version and build");
    Select(@"mode-control", 0);
    Press(@"lesson-multiplication-2");
    Press(@"lesson-help");
    Press(@"stage-inside");
    CheckGroupedStages(Answer(Find(@"lesson-expression").accessibilityLabel));
    CheckLiteralHeader();
    UIStackView *product=(UIStackView *)Find(@"stage-product-group");
    Require(product.axis==(AuditWindow.bounds.size.width>=1000 ? UILayoutConstraintAxisHorizontal : UILayoutConstraintAxisVertical), @"Normal phone and wide tablet choose a feasible grouped header layout");
    ScrollToHeaderPart(@"stage-product-group");
    Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"normal-header"});
    Later(2.0, ^{
        for (NSString *stage in @[@"first", @"inside", @"outside", @"last"]) {
            Press([@"stage-" stringByAppendingString:stage]);
            Require([[(UILabel *)Find(@"stage-heading") text] caseInsensitiveCompare:stage]==NSOrderedSame, @"Each of the four stage buttons still opens its own instruction");
            CheckLiteralHeader();
        }
        NSString *answer=Answer(Find(@"lesson-expression").accessibilityLabel);
        Press(@"final-answer");
        Require([Numbers(Find(@"final-answer-expression").accessibilityLabel).lastObject.stringValue isEqualToString:answer], @"Separate Final Answer action still shows the exact product");
        CheckAmpersandCarry();
    });
}

static void Begin(void) {
    Checks = [NSMutableArray new]; Pairs = [NSMutableSet new];
    ExpectedVersion = NSProcessInfo.processInfo.environment[@"RELEASE_AUDIT_EXPECT_VERSION"];
    Require([[NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"] isEqualToString:ExpectedVersion] && [[NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"] isEqualToString:ExpectedBuild], @"Running the expected packaged Release version and build");
    Require([DigitTitles() isEqualToArray:@[@"2"]], @"Addition starts with only digit choice 2");
    Require([ColorCode(AuditWindow.rootViewController.view.backgroundColor) isEqualToString:@"#FAF7F0"], @"Exact ivory background is packaged");
    UIButton *start = (UIButton *)Find(@"practice-start");
    Require(start.configuration.cornerStyle == UIButtonConfigurationCornerStyleFixed && start.configuration.background.cornerRadius == 4, @"Neutral controls have fixed four-point corners");
    Require(IsBlack(start.configuration.baseForegroundColor), @"Practice controls retain black foregrounds");
    Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"setup"});
    Later(2.0, ^{
        for (NSNumber *prior in @[@0, @1]) {
            Select(@"operation-control", 1);
            Require([DigitTitles() isEqualToArray:@[@"1", @"2"]], @"Multiplication exposes exactly one and two digits, with no three-digit option");
            Select(@"digit-count-control", prior.integerValue);
            Select(@"operation-control", 0);
            Require([DigitTitles() isEqualToArray:@[@"2"]] && [(UISegmentedControl *)Find(@"digit-count-control") selectedSegmentIndex] == 0, @"Switching M1 or M2 to addition selects only A2");
        }
        Select(@"operation-control", 1);
        Require([DigitTitles() isEqualToArray:@[@"1", @"2"]], @"Multiplication setup visibly contains only M1 and M2");
        Write(@"qa-release-artifact-audit-phase.json", @{@"phase": @"multiplication-settings"});
        Later(2.0, ^{
            Select(@"operation-control", 0);
            Require([DigitTitles() isEqualToArray:@[@"2"]], @"Addition remains available as A2 before the full round");
            Press(@"practice-start");
            Later(0.16, ^{ AnswerNext(0); });
        });
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
            ExpectedBuild = NSProcessInfo.processInfo.environment[@"RELEASE_AUDIT_EXPECT_BUILD"];
            AuditScope = NSProcessInfo.processInfo.environment[@"RELEASE_AUDIT_SCOPE"] ?: @"full";
            if ([AuditScope isEqualToString:@"ampersand-header"]) BeginAmpersandHeader(); else Begin();
        } @catch (NSException *error) { Report(error.reason); }
    });
}
