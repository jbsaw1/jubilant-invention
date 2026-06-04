async function loadXboxProfile() {
  const res = await fetch("/xbox-profile");
  const data = await res.json();
  console.log(data);
}
