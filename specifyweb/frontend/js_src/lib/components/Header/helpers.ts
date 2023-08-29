export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth().toString();
  const day = date.getDate().toString();
  const hours = date.getHours().toString();
  const minutes = date.getMinutes().toString();
  const seconds = date.getSeconds().toString();

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
