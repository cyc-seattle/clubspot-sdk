/* global Parse */

// Clubspot's sign-in looks the user up before it has a session, so this runs unauthenticated and
// queries with the master key.
Parse.Cloud.define("retrieveUsersByEmailOrMobileNumber", async (request) => {
  const { email } = request.params;
  if (typeof email !== "string" || email.length === 0) {
    return [];
  }
  return new Parse.Query(Parse.User).equalTo("email", email).find({ useMasterKey: true });
});
