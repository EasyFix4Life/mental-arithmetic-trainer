import Foundation

/// Owner-confirmed examples with the 2 November 2026 Inside/Outside naming correction.
enum ConfirmedExamples {
    static let multiplication: [AuthoredExample] = {
        // Build-time authored data, not downloaded or changed at runtime.
        let json = #"""
[
  {
    "id": "12-times-12",
    "title": "12 × 12 — no carrying",
    "example": {
      "operands": [
        "12",
        "12"
      ],
      "operation": "multiplication"
    },
    "finalAnswer": "144",
    "steps": [
      {
        "id": "12-first",
        "stageName": "First",
        "highlightedDigitRefs": [
          "left:0",
          "right:0"
        ],
        "operationDisplay": "1 × 1",
        "intermediateResult": "1",
        "visibleResultDigits": "1□□"
      },
      {
        "id": "12-inside",
        "stageName": "Inside",
        "highlightedDigitRefs": [
          "left:1",
          "right:0"
        ],
        "operationDisplay": "2 × 1",
        "intermediateResult": "2",
        "visibleResultDigits": "1□□"
      },
      {
        "id": "12-outside",
        "stageName": "Outside",
        "highlightedDigitRefs": [
          "left:0",
          "right:1"
        ],
        "operationDisplay": "1 × 2 = 2; 2 + 2",
        "intermediateResult": "4",
        "visibleResultDigits": "14□",
        "narration": "Combine Inside and Outside: 2 + 2 = 4."
      },
      {
        "id": "12-last",
        "stageName": "Last",
        "highlightedDigitRefs": [
          "left:1",
          "right:1"
        ],
        "operationDisplay": "2 × 2",
        "intermediateResult": "4",
        "visibleResultDigits": "144",
        "narration": "Product = 144."
      }
    ]
  },
  {
    "id": "18-times-18",
    "title": "18 × 18 — carrying",
    "example": {
      "operands": [
        "18",
        "18"
      ],
      "operation": "multiplication"
    },
    "finalAnswer": "324",
    "steps": [
      {
        "id": "18-first",
        "stageName": "First",
        "highlightedDigitRefs": [
          "left:0",
          "right:0"
        ],
        "operationDisplay": "1 × 1",
        "intermediateResult": "1",
        "visibleResultDigits": "□□□"
      },
      {
        "id": "18-inside",
        "stageName": "Inside",
        "highlightedDigitRefs": [
          "left:1",
          "right:0"
        ],
        "operationDisplay": "8 × 1",
        "intermediateResult": "8",
        "visibleResultDigits": "□□□"
      },
      {
        "id": "18-outside",
        "stageName": "Outside",
        "highlightedDigitRefs": [
          "left:0",
          "right:1"
        ],
        "operationDisplay": "1 × 8 = 8; 8 + 8",
        "intermediateResult": "16",
        "visibleResultDigits": "□□□",
        "narration": "Combine Inside and Outside: 8 + 8 = 16."
      },
      {
        "id": "18-last",
        "stageName": "Last",
        "highlightedDigitRefs": [
          "left:1",
          "right:1"
        ],
        "operationDisplay": "8 × 8",
        "intermediateResult": "64",
        "visibleResultDigits": "□□4",
        "carryOut": "6",
        "carryToStepId": "18-middle-carry",
        "carryToLabel": "Inside + Outside (16)",
        "narration": "Write 4, carry 6 to 16."
      },
      {
        "id": "18-middle-carry",
        "stageName": "Last",
        "stepLabel": "Carry to the middle",
        "highlightedDigitRefs": [],
        "operationDisplay": "16 + 6",
        "intermediateResult": "22",
        "visibleResultDigits": "□24",
        "carryIn": "6",
        "carryFromStepId": "18-last",
        "carryFromLabel": "Last (64)",
        "carryOut": "2",
        "carryToStepId": "18-first-carry",
        "carryToLabel": "First (1)",
        "narration": "16 + 6 = 22. Write 2, carry 2 to the first 1."
      },
      {
        "id": "18-first-carry",
        "stageName": "Last",
        "stepLabel": "Complete the answer",
        "highlightedDigitRefs": [
          "left:0",
          "right:0"
        ],
        "operationDisplay": "1 + 2",
        "intermediateResult": "3",
        "visibleResultDigits": "324",
        "carryIn": "2",
        "carryFromStepId": "18-middle-carry",
        "carryFromLabel": "Inside + Outside (22)",
        "narration": "1 + 2 = 3. Product = 324."
      }
    ]
  }
]
"""#
        let source = try! JSONDecoder().decode([AuthoredExample].self, from: Data(json.utf8))
        // Attach native calculation operands to the corrected display trace
        // so additions in cross-products/carries use the owner's vertical layout.
        return source.map { example in
            let left = Int(example.example.left)!, right = Int(example.example.right)!
            let inside = (left % 10) * (right / 10)
            let outside = (left / 10) * (right % 10)
            let steps = example.steps.map { original -> InstructionStep in
                var step = original
                if step.stageName == .outside {
                    step.calculationTerms = [CalculationTerm(left: String(left / 10), right: String(right % 10), operation: .multiplication),
                        CalculationTerm(left: String(inside), right: String(outside), operation: .addition)]
                } else if step.id == "18-middle-carry" {
                    step.calculationTerms = [CalculationTerm(left: "16", right: "6", operation: .addition)]
                } else if step.id == "18-first-carry" {
                    step.calculationTerms = [CalculationTerm(left: "1", right: "2", operation: .addition)]
                }
                return step
            }
            return AuthoredExample(id: example.id, title: example.title, example: example.example, steps: steps, finalAnswer: example.finalAnswer)
        }
    }()
}
