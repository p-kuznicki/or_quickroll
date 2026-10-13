# 4E Quick Rolls for Bones!

Małe rozszerzenie do Owlbear Rodeo, które dodaje stale widoczny panel z pięcioma rzutami:

- **D20** – zawsze `1d20`, jeden klik.
- **4 konfigurowalne przyciski** – każdy ma własną nazwę i proste makro kości.

Przykładowe makra:

- `1d20+6`
- `2d20+3`
- `2d8+d6+4`
- polski zapis `2K8+K6+4` też zostanie zamieniony na zapis `d`.

Po zapisaniu ustawień kliknięcie przycisku natychmiast wysyła publiczny rzut do **Bones!**. Nie otwiera edytora i nie wymaga potwierdzenia.

## Wymagania

1. Owlbear Rodeo.
2. Zainstalowane i włączone **Bones!**.
3. To rozszerzenie również musi być włączone w tym samym Roomie.

## Szybki test lokalny

W folderze rozszerzenia uruchom prosty serwer HTTP, np.:

```bash
python -m http.server 8000
```

Następnie w Owlbear Rodeo dodaj własne rozszerzenie, podając jako Install Link:

```text
http://localhost:8000/manifest.json
```

Oficjalny tutorial Owlbear Rodeo również używa adresu localhost do testowania rozszerzeń.

## Instalacja na stałe

Pliki trzeba hostować pod publicznym adresem HTTPS (np. GitHub Pages, Cloudflare Pages, Netlify). Jako link instalacyjny podajesz pełny adres do `manifest.json`.

## Obsługa

- Panel powinien pojawić się automatycznie w prawym dolnym rejonie stołu, nad standardowymi kontrolkami.
- Kliknij **⚙**, aby edytować cztery własne przyciski.
- Wpisz nazwę oraz makro, potem **Zapisz**.
- Od tej chwili każdy przycisk wykonuje rzut jednym kliknięciem.
- Przycisk akcji rozszerzenia **4E Quick Rolls** może ponownie otworzyć panel, jeśli zniknie.

## Zakres parsera

Celowo obsługiwane są tylko proste sumy i różnice:

```text
NdM + NdM + liczba
```

Np. `2d8+d6+4`, `1d20+7`, `2k6-1`.

Zaawansowane konstrukcje Roll20 typu `kh1`, exploding dice itd. są na razie odrzucane. Sam Bones! potrafi więcej, ale ten panel ma pozostać szybki i prosty.

## Technicznie

Integracja używa oficjalnie opisanej przez Bones! metody: zapisuje żądanie rzutu do metadanych bieżącego gracza pod kluczem:

`com.battle-system.bones/metadata_bonesroll`

Konfiguracja czterech przycisków jest zapisywana osobno w metadanych danego gracza, więc każdy gracz może mieć własne makra.
