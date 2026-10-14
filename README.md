# 4E Quick Rolls for Bones! — v0.4.0

Zmiany:

- **8 konfigurowalnych makr** zamiast 4, plus stały przycisk **D20**.
- Makra są zapisywane **lokalnie w przeglądarce (`localStorage`)** i dodatkowo w metadata Owlbeara.
- Dzięki lokalnemu zapisowi makra nie powinny wracać do domyślnych po zwykłym przeładowaniu strony.
- Stare konfiguracje 4-przyciskowe są migrowane: pierwsze 4 makra zostają, a makra 5–8 dostają wartości domyślne.
- Pozycja panelu również ma lokalny fallback, więc powinna przetrwać reload.

## Ważne

Lokalny zapis jest związany z daną przeglądarką/urządzeniem i ID gracza Owlbear. Jeśli ktoś zmieni przeglądarkę lub urządzenie, lokalny zapis nie przechodzi automatycznie na nowe urządzenie.

## GitHub Pages

Repozytorium używane w tej kampanii: `or_quickroll`. Manifest ma ścieżki `/or_quickroll/...`.

Po wrzuceniu plików poczekaj na zakończenie **Pages build and deployment**, a potem w razie potrzeby zrób twarde odświeżenie (`Ctrl+F5`).
