Feature: Reading a camp's entries

  Scenario: An entry arrives with its participant, sessions, classes, and billing
    Given the camp "Summer Optis" has a session "Week 1" and a class "Opti Green"
    And "Ada Lee" registers for "Week 1" in "Opti Green" and pays 450.00
    When an admin reads the entries of "Summer Optis"
    Then the entry for "Ada Lee" is in the session "Week 1" and the class "Opti Green"
    And the entry for "Ada Lee" shows 450.00 paid
