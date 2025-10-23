# Piatto



Meine Aufgabe:

-----
Ich Möchte eine Rezept Kollektion Logic hinzufügen

Schritt 1:
Add a model and schema for collection: A collection has a name description, creation date, user owner id, and a n:m relation with recipies. a recipi can be in multiple collections and a collction has multiple recipies. Add router endpoints and crud operations necessary for the following.

Step 2:
Edit RecipeLibrary: Hier sollen 2 sections angezeigt werden: Neue Rezepte und Sammlungen. neue Rezepte soll über ?last_recipe=1,2,3 befüllt werden: Falls kein last_recepi parameter in der url ist soll die section nicht angezeigt werden. Die zeite section soll die Collections anzeigen von dem User.

Step 3: Durch klicken soll man eine Sammlung öffnen können. Im gleichen Style von den RecipeVew sollen nun die Rezepte des Users von der Collection angezigt werden. Verwende React Components um nicht  zu viel Code doppelt zu haben.

Step 4: Ein Rezept im Rezept View soll ein Menue bekommen: Ein doppelpunkt mit 3 punkten ein menue button soll ein menue öffnen, in dem man das rezept löschen können soll und Sammlung bearbeiten.
Sammlung bearbeiten öffnet ein Menue:
  Alle Sammlungen sollen gefetched werden und als liste angezeigt. es soll gefetchet werden in welchen collections das rezept schon ist und diese collections bereits ausgewählt werden. man soll auswählen können in welcher sammlung das rezept danach überall sein soll. mann mus mind. 1 auswählen, wenn man keine auswählt soll statt seichern ein roter löschen button angezeigt werden. ein beispiel bild ist anbei.


  Bitte erst alles durchdenken, derzeitge Code Struktur und Implementierung anschauen, einen Plan ausarbeiten und offnene Fragen hier stellen. Nachdem ich dise beantwortet habe implentiere diese Änderungen professionell porduction ready.


---
AGENT ANTWORT:

## Schritt 1: Backend – Model, Schema, CRUD, Router

**Datenmodell:**
- Neue Tabelle `collection` mit Feldern:
  - `id` (PK)
  - `name`
  - `description`
  - `created_at`
  - `owner_id` (FK zu User)
- N:M Relation zu Rezepten:
  - Join-Tabelle `collection_recipe` mit `collection_id`, `recipe_id`
- SQLAlchemy-Modelle in models
- Pydantic-Schema in `backend/src/api/schemas/collection.py`
- CRUD-Logik in `backend/src/db/crud/collection_crud.py`
- Router in `backend/src/api/routers/collection.py`:
  - Endpunkte: 
    - GET `/collections` (alle Collections des Users)
    - GET `/collections/{id}` (Details inkl. Rezepte)
    - POST `/collections` (anlegen)
    - PUT `/collections/{id}` (bearbeiten)
    - DELETE `/collections/{id}` (löschen)
    - PATCH `/collections/{id}/recipes` (Rezepte zuweisen/entfernen)

---

## Schritt 2: Frontend – RecipeLibrary.jsx

**Sections:**
- Section 1: "Neue Rezepte"
  - Nur anzeigen, wenn `last_recipe`-Parameter in der URL vorhanden ist
  - Rezepte per API laden (IDs aus Query)
- Section 2: "Sammlungen"
  - Collections des Users per API laden und anzeigen

---

## Schritt 3: Frontend – Collection öffnen

- Beim Klick auf eine Collection:
  - Neue Seite/Komponente im Stil von `RecipeView`
  - Zeigt alle Rezepte der Collection
  - Wiederverwendung von RecipePreviewCard/RecipeView-Komponenten

---

## Schritt 4: Frontend – Rezept-Menü

- In `RecipeView`:
  - Menü-Button (3 Punkte)
  - Menü-Optionen: "Rezept löschen", "Sammlung bearbeiten"
- "Sammlung bearbeiten":
  - Modal/Dialog öffnet sich
  - Alle Collections des Users werden geladen
  - Collections, in denen das Rezept ist, sind vorausgewählt
  - Auswahl mindestens 1 Collection, sonst roter Löschen-Button
  - Speichern aktualisiert die Zuordnung per API

---

## Offene Fragen

1. **Backend:** Gibt es bereits ein User-Authentifizierungssystem, sodass owner_id eindeutig ist?
2. **Frontend:** Sollen Collections als eigene Seite (z.B. `/collections/:id`) oder als Modal angezeigt werden?
3. **API:** Sollen Rezepte beim Bearbeiten der Collection direkt entfernt/zugewiesen werden, oder gibt es einen "Speichern"-Button?
4. **Design:** Gibt es spezielle Designvorgaben für die Collection-Ansicht oder reicht die Wiederverwendung existierender Komponenten?
5. **Fehlerbehandlung:** Sollen Fehler (z.B. keine Collection ausgewählt) als Toast, Inline-Fehler oder Modal angezeigt werden?

---

MEINE ERGÄNZUNGEN:


1. Ja,     current_user_id: str = Depends(get_read_write_user_id)
2. Ich möchte wie jetzt die seite recepi view eine seite für collections und für jede collection eine recepi view seite similar zur jetztigen recepie all view seite
3. Beim bearbeiten soll sich ein modal öffnen man soll die kollections auswählen können und am ende peichern klicken können oder löschen klicken können, falls mean keine kollektion auswählt. Sie modal bsp bild.
4. passe das design an sich dem existierende frontend an und halte sich an die design guidelines
5.  Keine Kollektions soll dann eine Frame mit Text noch keine Kollektions und button neue kollektion erstellen kommen. bei dem modal soll im modal ein error message zu lesen sein speichern failed, so dass man es nochmal probieren kann

---


AGENT ANTOWRT:

## Analyse der bestehenden Struktur

### Backend
- **User-Authentifizierung:** `current_user_id: str = Depends(get_read_write_user_id)` ist vorhanden, owner_id kann eindeutig zugeordnet werden.
- **Rezepte:** Modelle und CRUD existieren bereits (`db_recipe.py`, `recipe_crud.py`).
- **API/Router:** Struktur für neue Endpunkte ist vorhanden (`routers/`, `schemas/`, `crud/`).
- **Datenbank:** SQLAlchemy-Modelle und Migrationen sind nutzbar.

### Frontend
- **Design:** Styleguide.md mit klaren Vorgaben (Farben, Typografie, Komponenten, Animationen, Responsiveness).
- **Komponenten:** Wiederverwendbare Komponenten wie `RecipePreviewCard`, `RecipeView`, Modal-Struktur, ErrorMessage vorhanden.
- **Seiten:** `RecipeLibrary.jsx` für Übersicht, `RecipeView.jsx` für Einzelansicht, Layouts und Contexts für Authentifizierung.
- **API:** API-Module für Rezepte vorhanden, können für Collections erweitert werden.

---

## Todo-Liste für die Umsetzung

1. **Backend: Collection Model & Schema**
   - Erstelle SQLAlchemy-Modelle für `Collection` und `CollectionRecipe` (n:m).
   - Erstelle Pydantic-Schema für Collection und Collection-Details.

2. **Backend: CRUD & Router**
   - Implementiere CRUD-Logik für Collections und Collection-Recipe-Zuordnung.
   - Erstelle API-Endpunkte:
     - GET `/collections` (User-Collections)
     - GET `/collections/{id}` (Details inkl. Rezepte)
     - POST `/collections` (anlegen)
     - PUT `/collections/{id}` (bearbeiten)
     - DELETE `/collections/{id}` (löschen)
     - PATCH `/collections/{id}/recipes` (Rezepte zuweisen/entfernen)

3. **Frontend: API-Anbindung**
   - Erweitere das API-Modul um Collection-Methoden.
   - Implementiere Fehlerbehandlung (ErrorMessage-Komponente).

4. **Frontend: RecipeLibrary.jsx**
   - Section "Neue Rezepte" (nur mit `last_recipe`-Param).
   - Section "Sammlungen" (User-Collections).
   - Zeige "Noch keine Kollektion" mit Button, falls keine vorhanden.

5. **Frontend: CollectionView-Seite**
   - Neue Seite für Collection-Ansicht, analog zu RecipeView.
   - Zeige alle Rezepte der Collection, nutze bestehende Komponenten.

6. **Frontend: CollectionRecipeView-Seite**
   - Neue Seite für Rezepte einer Collection, analog zu All-Recipe-View.
   - Wiederverwendung von RecipePreviewCard.

7. **Frontend: Rezept-Menü in RecipeView**
   - Menü-Button (3 Punkte) mit Optionen: "Rezept löschen", "Sammlung bearbeiten".
   - Öffne Modal für Sammlung bearbeiten.

8. **Frontend: Collection-Edit-Modal**
   - Modal mit Suchfeld, Collection-Liste, Checkboxen, Button "Neue Sammlung erstellen".
   - Zeige ErrorMessage im Modal bei Fehlern.
   - Button "Speichern" (mind. 1 Collection ausgewählt), sonst roter "Löschen"-Button.

9. **Frontend: Design & Responsiveness**
   - Passe Komponenten an Styleguide an (Farben, Abstände, Animationen, Responsiveness).
   - Teste auf Mobile und Desktop.

10. **Testing & Fehlerbehandlung**
    - Teste alle neuen Features auf verschiedenen Geräten.
    - Implementiere und teste Error-States (z.B. Speichern fehlgeschlagen).

---

DEINE Aufgabe:

Führe nun die Implementierung des ganze durch.