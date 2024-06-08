export function extractTelegramIdFromQuery() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return {
    telegramId: urlParams.get('telegramId'),
  };
}