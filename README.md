# 4E Quick Rolls for Bones! — v0.5.0

## Układ domyślny

Nie ma już osobnego dużego przycisku D20. Wszystkie 8 pól są równymi, edytowalnymi makrami.

Domyślnie, od góry:

1. `1d20` — fioletowo-różowy
2. `1d20`
3. `1d20`
4. `1d20`
5. `1d6`
6. `1d8`
7. `1d10`
8. `1d12`

Nazwy są puste. Jeśli nazwa jest pusta, na przycisku wyświetla się samo makro.

## Kolory

Każdy przycisk ma własny kolor wybierany w edycji. Kolor tekstu dobierany jest automatycznie dla czytelności.

## Zapamiętywanie

Konfiguracja (`nazwa`, `makro`, `kolor`) jest zapisywana w `localStorage` pod stałym kluczem niezależnym od chwilowego ID gracza, a dodatkowo w metadata Owlbeara. Dzięki temu zmiany powinny przetrwać reload i kolejne sesje w tej samej przeglądarce.

## GitHub Pages

Repozytorium kampanii: `or_quickroll`. Po wrzuceniu plików poczekaj na zielone **Pages build and deployment**, a potem użyj twardego odświeżenia (`Ctrl+F5`) w Owlbearze.
