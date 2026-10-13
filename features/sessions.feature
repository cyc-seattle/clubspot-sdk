Feature: Reading a camp's sessions

  Scenario: A session with no dates reads as having none
    Given the seeded camp "Fall Keelboat 2025"
    When an admin reads the sessions of "Fall Keelboat 2025"
    Then the session "Open Water (dates TBD)" has no start or end date
