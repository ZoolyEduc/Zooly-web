export function getId(item) {
  return item?._id || item?.id || "";
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}
