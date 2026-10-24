import Foundation

/// Exact supplied JSON, embedded so XCTest on an iOS simulator/device has no
/// dependency on the developer machine's filesystem or a network connection.
enum SuppliedAcceptanceData {
    static let json = #"""
{
  "title": "Mental Arithmetic Trainer \u2014 Examples and Edge Cases",
  "version": "1.0",
  "note": "Illustrative deterministic test vectors, not a fixed problem sequence. The app must generate randomized unique problems at runtime. Provisional policy for physical keystrokes after automatic submission remains unresolved.",
  "arithmeticExamples": [
    {
      "operation": "addition",
      "digitCount": 1,
      "operands": [
        1,
        1
      ],
      "expectedAnswer": 2,
      "expectedDigits": 1,
      "exactCorrectInput": "2",
      "sameLengthWrongInput": "3"
    },
    {
      "operation": "addition",
      "digitCount": 1,
      "operands": [
        9,
        9
      ],
      "expectedAnswer": 18,
      "expectedDigits": 2,
      "exactCorrectInput": "18",
      "sameLengthWrongInput": "19"
    },
    {
      "operation": "addition",
      "digitCount": 1,
      "operands": [
        7,
        8
      ],
      "expectedAnswer": 15,
      "expectedDigits": 2,
      "exactCorrectInput": "15",
      "sameLengthWrongInput": "16"
    },
    {
      "operation": "addition",
      "digitCount": 1,
      "operands": [
        4,
        5
      ],
      "expectedAnswer": 9,
      "expectedDigits": 1,
      "exactCorrectInput": "9",
      "sameLengthWrongInput": "8"
    },
    {
      "operation": "addition",
      "digitCount": 2,
      "operands": [
        10,
        10
      ],
      "expectedAnswer": 20,
      "expectedDigits": 2,
      "exactCorrectInput": "20",
      "sameLengthWrongInput": "21"
    },
    {
      "operation": "addition",
      "digitCount": 2,
      "operands": [
        10,
        99
      ],
      "expectedAnswer": 109,
      "expectedDigits": 3,
      "exactCorrectInput": "109",
      "sameLengthWrongInput": "110"
    },
    {
      "operation": "addition",
      "digitCount": 2,
      "operands": [
        50,
        50
      ],
      "expectedAnswer": 100,
      "expectedDigits": 3,
      "exactCorrectInput": "100",
      "sameLengthWrongInput": "101"
    },
    {
      "operation": "addition",
      "digitCount": 2,
      "operands": [
        99,
        99
      ],
      "expectedAnswer": 198,
      "expectedDigits": 3,
      "exactCorrectInput": "198",
      "sameLengthWrongInput": "199"
    },
    {
      "operation": "addition",
      "digitCount": 3,
      "operands": [
        100,
        100
      ],
      "expectedAnswer": 200,
      "expectedDigits": 3,
      "exactCorrectInput": "200",
      "sameLengthWrongInput": "201"
    },
    {
      "operation": "addition",
      "digitCount": 3,
      "operands": [
        100,
        999
      ],
      "expectedAnswer": 1099,
      "expectedDigits": 4,
      "exactCorrectInput": "1099",
      "sameLengthWrongInput": "1100"
    },
    {
      "operation": "addition",
      "digitCount": 3,
      "operands": [
        750,
        250
      ],
      "expectedAnswer": 1000,
      "expectedDigits": 4,
      "exactCorrectInput": "1000",
      "sameLengthWrongInput": "1001"
    },
    {
      "operation": "addition",
      "digitCount": 3,
      "operands": [
        999,
        999
      ],
      "expectedAnswer": 1998,
      "expectedDigits": 4,
      "exactCorrectInput": "1998",
      "sameLengthWrongInput": "1999"
    },
    {
      "operation": "multiplication",
      "digitCount": 1,
      "operands": [
        1,
        1
      ],
      "expectedAnswer": 1,
      "expectedDigits": 1,
      "exactCorrectInput": "1",
      "sameLengthWrongInput": "2"
    },
    {
      "operation": "multiplication",
      "digitCount": 1,
      "operands": [
        2,
        3
      ],
      "expectedAnswer": 6,
      "expectedDigits": 1,
      "exactCorrectInput": "6",
      "sameLengthWrongInput": "7"
    },
    {
      "operation": "multiplication",
      "digitCount": 1,
      "operands": [
        9,
        9
      ],
      "expectedAnswer": 81,
      "expectedDigits": 2,
      "exactCorrectInput": "81",
      "sameLengthWrongInput": "82"
    },
    {
      "operation": "multiplication",
      "digitCount": 2,
      "operands": [
        10,
        10
      ],
      "expectedAnswer": 100,
      "expectedDigits": 3,
      "exactCorrectInput": "100",
      "sameLengthWrongInput": "101"
    },
    {
      "operation": "multiplication",
      "digitCount": 2,
      "operands": [
        11,
        11
      ],
      "expectedAnswer": 121,
      "expectedDigits": 3,
      "exactCorrectInput": "121",
      "sameLengthWrongInput": "122"
    },
    {
      "operation": "multiplication",
      "digitCount": 2,
      "operands": [
        50,
        50
      ],
      "expectedAnswer": 2500,
      "expectedDigits": 4,
      "exactCorrectInput": "2500",
      "sameLengthWrongInput": "2501"
    },
    {
      "operation": "multiplication",
      "digitCount": 2,
      "operands": [
        99,
        99
      ],
      "expectedAnswer": 9801,
      "expectedDigits": 4,
      "exactCorrectInput": "9801",
      "sameLengthWrongInput": "9802"
    },
    {
      "operation": "multiplication",
      "digitCount": 3,
      "operands": [
        100,
        100
      ],
      "expectedAnswer": 10000,
      "expectedDigits": 5,
      "exactCorrectInput": "10000",
      "sameLengthWrongInput": "10001"
    },
    {
      "operation": "multiplication",
      "digitCount": 3,
      "operands": [
        101,
        101
      ],
      "expectedAnswer": 10201,
      "expectedDigits": 5,
      "exactCorrectInput": "10201",
      "sameLengthWrongInput": "10202"
    },
    {
      "operation": "multiplication",
      "digitCount": 3,
      "operands": [
        250,
        400
      ],
      "expectedAnswer": 100000,
      "expectedDigits": 6,
      "exactCorrectInput": "100000",
      "sameLengthWrongInput": "100001"
    },
    {
      "operation": "multiplication",
      "digitCount": 3,
      "operands": [
        999,
        999
      ],
      "expectedAnswer": 998001,
      "expectedDigits": 6,
      "exactCorrectInput": "998001",
      "sameLengthWrongInput": "998002"
    }
  ],
  "inputCases": [
    {
      "id": "incomplete-does-not-submit",
      "operation": "multiplication",
      "operands": [
        50,
        50
      ],
      "input": "250",
      "expectedDigits": 4,
      "shouldSubmit": false,
      "expectedOutcome": null
    },
    {
      "id": "complete-correct",
      "operation": "multiplication",
      "operands": [
        50,
        50
      ],
      "input": "2500",
      "expectedDigits": 4,
      "shouldSubmit": true,
      "expectedOutcome": "correct"
    },
    {
      "id": "complete-wrong",
      "operation": "multiplication",
      "operands": [
        50,
        50
      ],
      "input": "2501",
      "expectedDigits": 4,
      "shouldSubmit": true,
      "expectedOutcome": "incorrect"
    },
    {
      "id": "short-incorrect-not-submitted",
      "operation": "multiplication",
      "operands": [
        10,
        10
      ],
      "input": "99",
      "expectedDigits": 3,
      "shouldSubmit": false,
      "expectedOutcome": null
    },
    {
      "id": "exact-length-wrong",
      "operation": "multiplication",
      "operands": [
        10,
        10
      ],
      "input": "999",
      "expectedDigits": 3,
      "shouldSubmit": true,
      "expectedOutcome": "incorrect"
    },
    {
      "id": "leading-zero-same-length",
      "operation": "multiplication",
      "operands": [
        10,
        10
      ],
      "input": "010",
      "expectedDigits": 3,
      "shouldSubmit": true,
      "expectedOutcome": "incorrect"
    },
    {
      "id": "atomic-overlong-paste",
      "operation": "multiplication",
      "operands": [
        10,
        10
      ],
      "input": "1009",
      "expectedDigits": 3,
      "shouldSubmit": true,
      "expectedOutcome": "incorrect",
      "note": "Atomic overlong input is wrong, not silently truncated to correct prefix."
    },
    {
      "id": "single-digit-wrong-first",
      "operation": "multiplication",
      "operands": [
        2,
        3
      ],
      "input": "0",
      "expectedDigits": 1,
      "shouldSubmit": true,
      "expectedOutcome": "incorrect"
    },
    {
      "id": "single-digit-correct",
      "operation": "multiplication",
      "operands": [
        2,
        3
      ],
      "input": "6",
      "expectedDigits": 1,
      "shouldSubmit": true,
      "expectedOutcome": "correct"
    },
    {
      "id": "two-digit-addition-right",
      "operation": "addition",
      "operands": [
        7,
        8
      ],
      "input": "15",
      "expectedDigits": 2,
      "shouldSubmit": true,
      "expectedOutcome": "correct"
    },
    {
      "id": "two-digit-addition-wrong",
      "operation": "addition",
      "operands": [
        7,
        8
      ],
      "input": "14",
      "expectedDigits": 2,
      "shouldSubmit": true,
      "expectedOutcome": "incorrect"
    }
  ],
  "generationInvariants": {
    "roundLength": 10,
    "allowedOperations": [
      "addition",
      "multiplication"
    ],
    "operandDigitCounts": [
      1,
      2,
      3
    ],
    "bothOperandsSameSelectedDigitCount": true,
    "noRepeatedUnorderedOperandPairsInRound": true,
    "commutativeDuplicatesCountAsRepeat": true,
    "preGenerateFullRound": true,
    "oneDigitMinProvisional": 1
  },
  "roundScoringCases": [
    {
      "correctCount": 0,
      "display": "0 / 10"
    },
    {
      "correctCount": 1,
      "display": "1 / 10"
    },
    {
      "correctCount": 7,
      "display": "7 / 10"
    },
    {
      "correctCount": 10,
      "display": "10 / 10"
    }
  ]
}
"""#
}
