<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { extractTelegramIdFromQuery } from "../utils";
  import { onMount } from "svelte";

  let telegramID = "";
  let password = "";
  let token = "";
  let showTokenBox = false;

  onMount(() => {
    const params = extractTelegramIdFromQuery();
    telegramID = params.telegramId;
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
    <button on:click={() => (showTokenBox = false)}>OK</button>
  </div>
{/if}
