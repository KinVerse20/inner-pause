# Instagram ads

Two concepts, each in Instagram feed size (1080 x 1350, 4:5) and Story/Reels
size (1080 x 1920, 9:16; text kept clear of the top 250 px and bottom 340 px).

| File | Concept |
|---|---|
| `ad-1-three-minutes-*.png` | Calm, deep navy: the breathing rings, "Your mind, three minutes from now.", breathe in 4 out 6 |
| `ad-2-a-pause-for-that-*.png` | Warm and light: a real screen of the app in a phone, the feelings people bring to it, "Overthinking at 2 am? There's a Pause for that." |

Point the ads at the landing page and tag them, for example:
`https://<your-domain>/welcome?utm_source=instagram&utm_campaign=three-minutes`
The tags follow the visitor to /install and are saved on their account at sign up.

To change the words or colours, edit the `.html` files and render again:
`node marketing/ads/render.mjs` (needs Google Chrome). `phone-player.png` is
the app's player during the breathing exercise, captured at 3x.
