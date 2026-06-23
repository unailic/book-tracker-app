# BookSelf

Mobilna aplikacija za praćenje knjiga izrađena u okviru kursa **Mobilno Računarstvo** na Fakultetu organizacionih nauka, Univerzitet u Beogradu.

**Autori:** Una Ilić & Anja Perović

## O aplikaciji

BookSelf je hibridna mobilna aplikacija koja korisnicima omogućava da prate knjige koje čitaju, planiraju da pročitaju ili su već pročitali. Aplikacija funkcioniše na dva načina - administrator upravlja globalnim katalogom knjiga, dok korisnici grade svoju ličnu biblioteku.

## Tehnologije

<div align="center">
  
| Tehnologija | Verzija |
|---|---|
| Ionic Framework | 7.2.1 |
| Angular | 21.x |
| TypeScript | — |
| Firebase Realtime Database | REST API |
| Firebase Authentication | REST API (identitytoolkit) |
| Node.js | 22.x |

</div>

## Funkcionalnosti

### Korisnik
- Registracija i prijava putem email-a i lozinke (token autentifikacija)
- Pretraga i pregled globalnog kataloga knjiga po žanrovima
- Dodavanje knjiga iz kataloga u ličnu biblioteku
- Praćenje statusa čitanja (Planirane / Trenutno čitam / Pročitane)
- Ocenjivanje knjiga (1–5 zvezdica)
- Dodavanje ličnih beleški uz svaku knjigu
- Pregled lične statistike (ukupan broj, prosečna ocena, najpopularnija knjiga)
- Uređivanje profila (korisničko ime, slika profila)

### Administrator
- Upravljanje globalnim katalogom knjiga (dodavanje, izmena, brisanje)
- Pregled liste registrovanih korisnika
- Brisanje korisnika
- Pregled sistemskih statistika (broj korisnika, knjiga u katalogu, najpopularnije knjige)

## Struktura baze podataka (Firebase Realtime Database)

```
root/
├── catalogue/
│   └── {bookId}/
│       ├── title
│       ├── author
│       ├── genre
│       ├── description
│       ├── year
│       └── coverUrl
└── users/
    └── {userId}/
        ├── profile/
        │   ├── email
        │   ├── role        ("admin" | "user")
        │   ├── username
        │   └── avatarUrl
        └── books/
            └── {bookId}/
                ├── catalogueBookId
                ├── title
                ├── author
                ├── genre
                ├── status  ("planned" | "reading" | "finished")
                ├── rating
                ├── notes
                └── userId
```

## Autentifikacija

Aplikacija koristi **Firebase REST API** za autentifikaciju (bez Firebase SDK-a):

- Registracija: `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp`
- Prijava: `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`

Nakon prijave, dobijeni `idToken` se čuva u `localStorage` i šalje kao `?auth={token}` parametar uz svaki zahtev ka Realtime Database-u.

## Pokretanje projekta

### Preduslovi

- Node.js v18+
- npm
- Ionic CLI (`npm install -g @ionic/cli`)
- Angular CLI (`npm install -g @angular/cli`)

### Instalacija

```bash
git clone https://github.com/unailic/book-tracker-app.git
cd book-tracker-app
npm install
```

### Konfiguracija Firebase-a

Kopiraj `src/environments/environment.example.ts` u `src/environments/environment.ts` i popuni svoje Firebase podatke:

```typescript
export const environment = {
  production: false,
  firebaseApiKey: 'TVOJ_API_KEY',
  firebaseDatabaseUrl: 'TVOJ_DATABASE_URL'
};
```

### Pokretanje

```bash
ionic serve
```

App se otvara na `http://localhost:8100`.

Za testiranje na mobilnom uređaju (isti WiFi):

```bash
ionic serve --host=0.0.0.0
```

Pa otvori prikazanu `External` IP adresu na telefonu.

## Struktura projekta

```
src/app/
├── auth/
│   ├── login/          # Stranica za prijavu
│   └── register/       # Stranica za registraciju
├── tabs/               # Glavni tab layout
├── tab1/               # Katalog / Pretraži knjige
├── tab2/               # Korisnici (admin) / Moje knjige (korisnik)
├── tab3/               # Statistike (admin) / Moj profil (korisnik)
├── services/
│   ├── auth.service.ts       # Autentifikacija
│   ├── book.service.ts       # Lična biblioteka korisnika
│   └── catalogue.service.ts  # Globalni katalog
└── models/
    └── book.model.ts         # Book interfejs
```

## Administratorski nalog

Za testiranje admin funkcionalnosti, potrebno je ručno postaviti `role: "admin"` u Firebase konzoli za željenog korisnika (`users/{userId}/profile/role`).

## Kurs

Mobilno Računarstvo — Fakultet organizacionih nauka, Univerzitet u Beogradu, 2025/2026.
