<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { extractTelegramIdFromQuery } from "../utils";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import "../styles.css";

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

<main>
  <div class="form-container">
    <form on:submit|preventDefault={signUp}>
      <input
        type="text"
        bind:value={telegramID}
        required
        placeholder="Telegram ID"
      />
      <input
        type="password"
        bind:value={password}
        required
        placeholder="Password"
      />
      <div class="buttons-container">
        <button type="submit">Sign Up</button>
        {#if errorMessage}
          <p class="error">{@html errorMessage}</p>
        {/if}
      </div>
    </form>

    {#if showTokenBox}
      <div class="token-box">
        <p>Your token is: {token}</p>
        <button on:click={() => navigate("/profile")}>OK</button>
      </div>
    {/if}

    <div class="buttons-container">
      <button class="link-button" on:click={() => navigate("/profile")}
        >Login</button
      >
    </div>
  </div>
</main>
