Feature: Reading more entries than one page holds

  Scenario: Paging reads every entry of a camp with more than 1000 entries
    Given the seeded camp "Learn to Sail Fleet 2026"
    When an admin reads the entries of "Learn to Sail Fleet 2026" 1000 at a time
    Then they read 1001 different entries
