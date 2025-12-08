// plugins/janus.client.ts
export default defineNuxtPlugin(async () => {
const mod = await import("janus-simple-videoroom-client");
const createVideoRoomClient =
  mod.createVideoRoomClient ||
  (mod.default && mod.default.createVideoRoomClient) ||
  mod.default;
const client = await createVideoRoomClient({ debug: true });
return { provide: { janusClient: client } };
});