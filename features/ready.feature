Feature: The fake reports when it is ready

  Scenario: A seeded fake is ready
    When the fake's readiness is checked
    Then the fake is ready
