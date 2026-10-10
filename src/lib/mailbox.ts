// Keep visitor validation aligned with the delivery provider's single-mailbox format.
export function validMailbox(value:unknown):value is string {
  return typeof value==='string'&&/^[^\s@,<>\r\n]+@[^\s@,<>\r\n]+\.[^\s@,<>\r\n]+$/.test(value);
}
