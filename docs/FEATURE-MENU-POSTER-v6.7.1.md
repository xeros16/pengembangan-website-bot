# Illustrated Feature Menu — v6.7.1 (Historical)

> Historical note: the PIR Visuals main-menu poster was removed in v6.7.3. This document describes the previous release only; do not restore the poster asset or its send flow. The separate Pixel Realm Game Center menu is unaffected.


## Design structure

The main menu follows the supplied Pixel Realm help infographic: a branded illustrated header, numbered feature panels, short command examples, a quick-access footer, and a security reminder. The PIR Visuals adaptation uses six equal-width cards so the categories remain legible on a phone.

## Categories shown

1. **Design & Creative** — `.wizard`, `.creative`, `.designproject`, `.designrender`.
2. **Image & Media** — `.info`, `.ratio`, `.resize`, `.compress`, `.sticker`, `.dl`.
3. **Learning & Community** — `.designlearn`, `.designchallenge`, `.designcommunity`, `.cohort`.
4. **Portfolio & Directory** — `.design`, `.designer`, `.portfolio`, `.studio`.
5. **Group & Support** — `.rules`, `.antilink`, `.warn`, `.modstatus`, `.support`, `.ticket`.
6. **Games & Entertainment** — `.games`, `.game`, `.pr menu`, `.anime`, `.music`.

The poster intentionally shows only representative commands. It does not replace the complete registry.

## WhatsApp behavior

- `.menu` sends the illustrated main menu and then the text home menu.
- `.help` without an argument uses the same main-menu behavior.
- `.fitur` sends the same poster and then the complete category index with command counts and workflow shortcuts.
- `.fitur cari <kebutuhan>`, `.fitur kategori <nama>`, `.fitur semua [halaman]`, and `.fitur alur [id]` remain text responses.
- `.menu <kategori>` continues to open the existing category-specific text menu.
- If the image file is missing or image delivery fails, the text menu is still sent.
- If `PREFIX` is not `.`, the bot skips the static poster and sends text so command prefixes remain correct.

## Asset

`assets/images/menu/pir_visuals_feature_menu.png` is the main menu artwork. Keep this file in the deployed project. It contains no user data or credentials.
