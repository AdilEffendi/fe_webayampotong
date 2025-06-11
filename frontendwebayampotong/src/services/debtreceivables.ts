export async function createDebtReceivable(data: any, token: string) {
  const url = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL + "/debt-receivables"
    : "http://localhost:3000/debt-receivables";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal menambah hutang (debt receivable)");
  return await res.json();
}
