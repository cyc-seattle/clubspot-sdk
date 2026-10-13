Feature: Discovering a club's camps

  Scenario: Discovery skips archived camps
    Given the club "Puget Youth Sailing" has a camp "Summer Optis"
    And the club "Puget Youth Sailing" has an archived camp "Spring Lasers"
    When an admin discovers the camps of "Puget Youth Sailing"
    Then the camps found are only "Summer Optis"
