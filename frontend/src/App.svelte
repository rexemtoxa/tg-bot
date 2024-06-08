<script>
  import { Router, Route } from "svelte-routing";
  import Signup from "./routes/signup.svelte";
  import Profile from "./routes/profile.svelte";
</script>

<main>
  <Router>
    <Route path="/" component={Signup} />
    <Route path="profile" component={Profile} />
  </Router>
</main>
