<script lang="ts">
  import { navigate } from "svelte-routing";
  import { onMount } from "svelte";
  import "../styles.css";

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
      loading = false;
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
    <div class="form-container">
      {#if showLoginBox}
        <form on:submit|preventDefault={login}>
          <h2>Log In</h2>
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
            <button type="submit">Log In</button>
            {#if errorMessage}
              <p>{errorMessage}</p>
            {/if}
          </div>
        </form>
      {/if}

      {#if showTokenBox}
        <div>
          <h2>Verify Token</h2>
          <input
            type="text"
            bind:value={token}
            required
            placeholder="Token"
            class="full-width-input"
          />
          <div class="buttons-container">
            <button on:click={verifyToken}>Verify Token</button>
            {#if errorMessage}
              <p>{errorMessage}</p>
            {/if}
          </div>
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
    </div>
  {/if}
</main>
