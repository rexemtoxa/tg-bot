<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { extractTelegramIdFromQuery } from "../utils";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";

  let telegramID = "";
  let password = "";
  let token = "";
  let showTokenBox = false;
  let showLoginButton = false;

  onMount(async () => {
    const params = extractTelegramIdFromQuery();
    telegramID = params.telegramId;
    try {
      const response = await fetch("/api/user", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        navigate("/profile");
      } else {
        showLoginButton = true;
      }
    } catch (error) {
      console.log("User not authenticated");
      showLoginButton = true;
    }
  });

  const signUp = async () => {
    token = uuidv4();
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramID, password, token }),
    });

    if (response.ok) {
      showTokenBox = true;
    }
  };

  const goToLogin = () => {
    navigate("/profile");
  };
</script>

<form on:submit|preventDefault={signUp}>
  <label>
    Telegram ID:
    <input type="text" bind:value={telegramID} required />
  </label>
  <label>
    Password:
    <input type="password" bind:value={password} required />
  </label>
  <button type="submit">Sign Up</button>
</form>

{#if showTokenBox}
  <div>
    <p>Your token is: {token}</p>
    <button on:click={() => navigate("/profile")}>OK</button>
  </div>
{/if}

{#if showLoginButton}
  <button on:click={goToLogin}>Login</button>
{/if}
