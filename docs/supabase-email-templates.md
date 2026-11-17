# Supabase: laiškai ir nuorodos (Lėkštė)

Kodėl: numatytieji Supabase laiškai angliški, o jų nuoroda veikia tik toje naršyklėje, kur žmogus registravosi.
Atidarius laišką telefone (Gmail programėlėje) nuoroda „sulūžta“ ir žmogų numeta ne ten. Šie šablonai naudoja
`token_hash` nuorodą, kuri veikia bet kuriame įrenginyje.

## 1. URL Configuration (Authentication → URL Configuration)

- **Site URL:** `https://www.finoraai.solutions`
- **Redirect URLs** (Add URL, abu):
  - `https://www.finoraai.solutions/**`
  - `https://finoraai.solutions/**`

## 2. Šablonai (Authentication → Emails → Templates)

Kiekvienam: įklijuokite **Subject** ir **Message body** (Source / HTML), spauskite **Save**.

### Confirm signup

**Subject:** `Patvirtinkite Lėkštė paskyrą`

**Message body:**

```html
<div style="background:#F8F7F2;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#17241D">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px 28px">
    <div style="font-size:22px;font-weight:800;color:#174B35">Lėkštė</div>
    <h1 style="font-size:22px;line-height:1.25;margin:24px 0 8px">Patvirtinkite paskyrą</h1>
    <p style="font-size:15px;line-height:1.5;color:#3d4a43;margin:0 0 24px">Liko vienas žingsnis: paspauskite mygtuką ir jūsų mitybos planas bus išsaugotas paskyroje. Nuoroda veikia bet kuriame įrenginyje.</p>
    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email" style="display:inline-block;background:#31966A;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:14px">Patvirtinti paskyrą</a>
    <p style="font-size:12.5px;line-height:1.5;color:#5E6B63;margin:24px 0 0">Jei paskyros nekūrėte — tiesiog ignoruokite šį laišką.</p>
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:11.5px;color:#5E6B63;text-align:center">Lėkštė · mitybos planas iš jūsų parduotuvės prekių</p>
</div>
```

### Reset password

**Subject:** `Lėkštė: naujas slaptažodis`

**Message body:**

```html
<div style="background:#F8F7F2;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#17241D">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px 28px">
    <div style="font-size:22px;font-weight:800;color:#174B35">Lėkštė</div>
    <h1 style="font-size:22px;line-height:1.25;margin:24px 0 8px">Naujas slaptažodis</h1>
    <p style="font-size:15px;line-height:1.5;color:#3d4a43;margin:0 0 24px">Paspauskite mygtuką ir įveskite naują slaptažodį. Nuoroda galioja 1 valandą.</p>
    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery" style="display:inline-block;background:#31966A;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:14px">Sukurti naują slaptažodį</a>
    <p style="font-size:12.5px;line-height:1.5;color:#5E6B63;margin:24px 0 0">Jei slaptažodžio keisti neprašėte — ignoruokite laišką, niekas nepasikeis.</p>
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:11.5px;color:#5E6B63;text-align:center">Lėkštė · mitybos planas iš jūsų parduotuvės prekių</p>
</div>
```

### Magic link

**Subject:** `Lėkštė: prisijungimo nuoroda`

**Message body:**

```html
<div style="background:#F8F7F2;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#17241D">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px 28px">
    <div style="font-size:22px;font-weight:800;color:#174B35">Lėkštė</div>
    <h1 style="font-size:22px;line-height:1.25;margin:24px 0 8px">Prisijungimas</h1>
    <p style="font-size:15px;line-height:1.5;color:#3d4a43;margin:0 0 24px">Paspauskite mygtuką ir būsite prisijungę prie Lėkštė.</p>
    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email" style="display:inline-block;background:#31966A;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:14px">Prisijungti</a>
    <p style="font-size:12.5px;line-height:1.5;color:#5E6B63;margin:24px 0 0">Jei prisijungti neprašėte — ignoruokite laišką.</p>
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:11.5px;color:#5E6B63;text-align:center">Lėkštė · mitybos planas iš jūsų parduotuvės prekių</p>
</div>
```

### Change email address

**Subject:** `Lėkštė: patvirtinkite naują el. paštą`

**Message body:**

```html
<div style="background:#F8F7F2;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#17241D">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px 28px">
    <div style="font-size:22px;font-weight:800;color:#174B35">Lėkštė</div>
    <h1 style="font-size:22px;line-height:1.25;margin:24px 0 8px">Naujas el. pašto adresas</h1>
    <p style="font-size:15px;line-height:1.5;color:#3d4a43;margin:0 0 24px">Patvirtinkite, kad paskyros el. paštas keičiamas į {{ .NewEmail }}.</p>
    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change" style="display:inline-block;background:#31966A;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:14px">Patvirtinti</a>
    <p style="font-size:12.5px;line-height:1.5;color:#5E6B63;margin:24px 0 0">Jei el. pašto nekeitėte — parašykite mums.</p>
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:11.5px;color:#5E6B63;text-align:center">Lėkštė · mitybos planas iš jūsų parduotuvės prekių</p>
</div>
```

## 3. Rekomenduojama

- **Siuntėjas.** Be savo SMTP Supabase siunčia iš `noreply@mail.app.supabase.io`, tik kelis laiškus per valandą, ir jie dažnai patenka į „Spam“.
  Authentication → Emails → SMTP Settings: prijunkite pvz. Resend (nemokamai iki 3 000 laiškų/mėn.) su savo domenu, siuntėjas `Lėkštė <labas@jusu-domenas>`.
- **Greičiausias kelias be laiškų painiavos:** Authentication → Sign In / Providers → Email → išjunkite **Confirm email**.
  Tada registracija iš karto prisijungia, o laiškai lieka tik slaptažodžiui atkurti. Bandomąją savaitę vis tiek saugo Stripe (reikia kortelės).
