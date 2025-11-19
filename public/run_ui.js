const { exec } = require("child_process");

exec("npx next start -p 3000", (err) => {
  if (err) console.error(err);
});
