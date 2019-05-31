export default (url?: string) => {
  if (!url || !window) {
    return;
  }
  const newTab = window.open();
  newTab!.opener = null;
  newTab!.location.href = url;
};
