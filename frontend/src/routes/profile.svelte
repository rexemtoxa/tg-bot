<script lang="ts">
  let telegramID = "";
  let password = "";
  let token = "";
  let showLoginBox = true;
  let showTokenBox = false;
  let userProfile = null;

  const login = async () => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramID, password }),
    });

    if (response.ok) {
      showLoginBox = false;
      showTokenBox = true;
    }
  };

  const verifyToken = async () => {
    const response = await fetch("/api/verify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramID, token }),
    });

    if (response.ok) {
      userProfile = await response.json();
      showTokenBox = false;
    }
  };
</script>

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
  </form>
{/if}

{#if showTokenBox}
  <div>
    <label>
      Token:
      <input type="text" bind:value={token} required />
    </label>
    <button on:click={verifyToken}>Verify Token</button>
  </div>
{/if}

{#if userProfile}
  <div>
    <h2>Profile</h2>
    <p>Telegram ID: {userProfile.telegram_id}</p>
    <p>Created At: {userProfile.created_at}</p>
  </div>
{/if}
