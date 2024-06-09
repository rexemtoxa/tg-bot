<script lang="ts">
  import { navigate } from "svelte-routing";
  import { onMount } from "svelte";

  let telegramID = "";
  let password = "";
  let token = "";
  let tempToken = "";
  let showLoginBox = false;
  let showTokenBox = false;
  let userProfile = null;
  let errorMessage = "";
  let loading = true;

  onMount(async () => {
    try {
      const response = await fetch("/api/user", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        userProfile = await response.json();
        showLoginBox = false;
        showTokenBox = false;
      } else {
        showLoginBox = true;
      }
    } catch (error) {
      showLoginBox = true;
    } finally {
      loading = false; // Set loading to false once the check is complete
    }
  });

  const login = async () => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramID, password }),
      });

      if (response.ok) {
        const data = await response.json();
        tempToken = data.tempToken;
        showLoginBox = false;
        showTokenBox = true;
        errorMessage = "";
      } else {
        const errorData = await response.json();
        errorMessage = errorData.error;
      }
    } catch (error) {
      errorMessage = "An error occurred";
    }
  };

  const verifyToken = async () => {
    try {
      const response = await fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramID, token, tempToken }),
      });

      if (response.ok) {
        userProfile = await response.json();
        showTokenBox = false;
        errorMessage = "";
      } else {
        const errorData = await response.json();
        errorMessage = errorData.error;
        navigate("/");
      }
    } catch (error) {
      errorMessage = "An error occurred";
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        userProfile = null;
        showLoginBox = true;
        errorMessage = "";
        navigate("/");
      } else {
        const errorData = await response.json();
        errorMessage = errorData.error;
      }
    } catch (error) {
      errorMessage = "An error occurred";
    }
  };
</script>

<main>
  {#if loading}
    <p>Loading...</p>
  {:else}
    {#if showLoginBox}
      <form on:submit|preventDefault={login}>
        <label>
          Telegram ID:
          <input type="text" bind:value={telegramID} required />
        </label>
        <label>
          Password:
          <input type="password" bind:value={password} required />
        </label>
        <button type="submit">Log In</button>
        {#if errorMessage}
          <p>{errorMessage}</p>
        {/if}
      </form>
    {/if}

    {#if showTokenBox}
      <div>
        <label>
          Token:
          <input type="text" bind:value={token} required />
        </label>
        <button on:click={verifyToken}>Verify Token</button>
        {#if errorMessage}
          <p>{errorMessage}</p>
        {/if}
      </div>
    {/if}

    {#if userProfile}
      <div>
        <h2>Profile</h2>
        <p>Telegram ID: {userProfile.telegramID}</p>
        <p>Created At: {userProfile.createdAt}</p>
        <button on:click={logout}>Log Out</button>
      </div>
    {/if}
  {/if}
</main>
