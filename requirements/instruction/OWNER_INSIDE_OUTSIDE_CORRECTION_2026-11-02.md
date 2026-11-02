# Owner correction: Inside and Outside

On 2026-11-02, the owner supplied Android 1.1.3 screenshots of the 82 × 76 walkthrough and stated that the Inside and Outside instructions were backwards. They requested correction across all platforms and updated website/GitHub application downloads.

For horizontal two-digit multiplication `ab × cd`, the current instruction is:

1. **First:** `a × c`.
2. **Inside:** `b × c` — the units digit of the left/top operand and the tens digit of the right/bottom operand, which are the two inner digits in the horizontal expression.
3. **Outside:** `a × d` — the tens digit of the left/top operand and the units digit of the right/bottom operand, which are the two outer digits in the horizontal expression. Combine Inside and Outside at this stage.
4. **Last:** `b × d`, followed by the existing right-to-left carry resolution and final answer.

For **82 × 76**: First = 56, Inside = **2 × 7 = 14**, Outside = **8 × 6 = 48**, combined middle = **14 + 48 = 62**, Last = 12. Existing carries yield **6232**.

The highlighted operand digits, operation text, intermediate results, narration, accessible descriptions and carry references must agree with these stages. Apply the correction to generated examples and the selectable 12 × 12 and 18 × 18 examples, even where equal cross-products previously concealed the reversal.

This correction supersedes the historical Inside/Outside mapping in the earlier instructional intake. Preserve the supplied source documents unchanged for provenance. It changes no Practice behavior or available addition choices. Three-digit multiplication continues to use its existing numbered product-group stages.
