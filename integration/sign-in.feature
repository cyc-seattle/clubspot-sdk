Feature: Signing in to Clubspot by email

  Scenario: A user whose username isn't their email signs in with their email
    Given a user "Robin Reyes" whose username isn't their email
    When "Robin Reyes" signs in with their email
    Then "Robin Reyes" is signed in

  Scenario: An email that belongs to no one can't sign in
    When someone signs in with an email that belongs to no one
    Then they are told no user has that email
