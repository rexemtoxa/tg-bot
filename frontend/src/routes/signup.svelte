<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { extractTelegramIdFromQuery } from "../utils";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";

  let telegramID = "";
  let password = "";
  let token = "";
  let showTokenBox = false;
  let errorMessage = "";

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
      }
    } catch (error) {
      console.log("User not authenticated");
    }
  });

  const signUp = async () => {
    token = uuidv4();
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramID, password, token }),
    });

    if (response.status === 409) {
      navigate("/profile");
    } else if (response.ok) {
      showTokenBox = true;
      errorMessage = "";
    } else {
      const errorData = await response.json();
      if (errorData.error.includes("Telegram bot")) {
        errorMessage = `<p>${errorData.error.replace("Telegram bot @TestAssessmentAntonRehemae_bot", '<a href="https://t.me/TestAssessmentAntonRehemae_bot" target="_blank">Telegram bot</a>')}</p>`;
      } else {
        errorMessage = errorData.error;
      }
    }
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
  {#if errorMessage}
    <p>{@html errorMessage}</p>
  {/if}
</form>

{#if showTokenBox}
  <div>
    <p>Your token is: {token}</p>
    <button on:click={() => navigate("/profile")}>OK</button>
  </div>
{/if}

<button on:click={() => navigate("/profile")}>Login</button>
