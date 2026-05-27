#!/usr/bin/env python3
"""ARPT Guinee - Etat du Projet - Rapport PDF (Body)"""

import sys, os, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ──
pdfmetrics.registerFont(TTFont('DejaVuSerif', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerifBold', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans', '/usr/share/fonts/truetype/chinese/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMono', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))

registerFontFamily('DejaVuSerif', normal='DejaVuSerif', bold='DejaVuSerifBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')
registerFontFamily('LiberationSans', normal='LiberationSans', bold='LiberationSans')
registerFontFamily('SarasaMono', normal='SarasaMono', bold='SarasaMono')

# ── Cascade Palette ──
PAGE_BG       = colors.HexColor('#f1f1f0')
SECTION_BG    = colors.HexColor('#edecea')
CARD_BG       = colors.HexColor('#eeedeb')
TABLE_STRIPE  = colors.HexColor('#efeeec')
HEADER_FILL   = colors.HexColor('#766944')
COVER_BLOCK   = colors.HexColor('#6d654e')
BORDER        = colors.HexColor('#cfcab8')
ICON          = colors.HexColor('#8d7e4e')
ACCENT        = colors.HexColor('#4b29b0')
ACCENT_2      = colors.HexColor('#37b074')
TEXT_PRIMARY   = colors.HexColor('#1d1d1a')
TEXT_MUTED     = colors.HexColor('#7f7c75')
SEM_SUCCESS   = colors.HexColor('#457f58')
SEM_WARNING   = colors.HexColor('#987c45')
SEM_ERROR     = colors.HexColor('#a44f48')
SEM_INFO      = colors.HexColor('#4e7ba7')

# ── Page Setup ──
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 1.0 * inch
RIGHT_MARGIN = 1.0 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.8 * inch
CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN
H1_ORPHAN = (PAGE_H - TOP_MARGIN - BOTTOM_MARGIN) * 0.15

# ── Styles ──
FONT = 'DejaVuSerif'
FONT_SANS = 'DejaVuSans'
FONT_SANS_BOLD = 'DejaVuSansBold'

body_style = ParagraphStyle(
    name='Body', fontName=FONT, fontSize=10.5, leading=17,
    alignment=TA_JUSTIFY, spaceAfter=8, textColor=TEXT_PRIMARY,
)
body_left = ParagraphStyle(
    name='BodyLeft', fontName=FONT, fontSize=10.5, leading=17,
    alignment=TA_LEFT, spaceAfter=8, textColor=TEXT_PRIMARY,
)
h1_style = ParagraphStyle(
    name='H1', fontName=FONT, fontSize=20, leading=26,
    alignment=TA_LEFT, spaceBefore=18, spaceAfter=10,
    textColor=HEADER_FILL,
)
h2_style = ParagraphStyle(
    name='H2', fontName=FONT, fontSize=15, leading=20,
    alignment=TA_LEFT, spaceBefore=14, spaceAfter=8,
    textColor=ACCENT,
)
h3_style = ParagraphStyle(
    name='H3', fontName=FONT, fontSize=12, leading=16,
    alignment=TA_LEFT, spaceBefore=10, spaceAfter=6,
    textColor=TEXT_PRIMARY,
)
caption_style = ParagraphStyle(
    name='Caption', fontName=FONT, fontSize=9, leading=13,
    alignment=TA_CENTER, spaceBefore=3, spaceAfter=6,
    textColor=TEXT_MUTED,
)
toc_h1 = ParagraphStyle(name='TOCH1', fontName=FONT, fontSize=13, leftIndent=20, leading=22)
toc_h2 = ParagraphStyle(name='TOCH2', fontName=FONT, fontSize=11, leftIndent=40, leading=18)
header_cell_style = ParagraphStyle(
    name='HeaderCell', fontName=FONT_SANS_BOLD, fontSize=10, leading=14,
    alignment=TA_CENTER, textColor=colors.white,
)
cell_style = ParagraphStyle(
    name='Cell', fontName=FONT_SANS, fontSize=9.5, leading=14,
    alignment=TA_CENTER, textColor=TEXT_PRIMARY,
)
cell_left = ParagraphStyle(
    name='CellLeft', fontName=FONT_SANS, fontSize=9.5, leading=14,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY,
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName=FONT, fontSize=10.5, leading=17,
    alignment=TA_LEFT, spaceAfter=4, leftIndent=18,
    bulletIndent=6, textColor=TEXT_PRIMARY,
)
callout_style = ParagraphStyle(
    name='Callout', fontName=FONT, fontSize=11, leading=18,
    alignment=TA_LEFT, spaceAfter=8, leftIndent=24,
    borderColor=ACCENT, borderWidth=2, borderPadding=8,
    textColor=ACCENT,
)

# ── TOC DocTemplate ──
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def add_major_section(text, style):
    return [
        CondPageBreak(H1_ORPHAN),
        add_heading(text, style, level=0),
    ]

# ── Table helper ──
def make_table(headers, rows, col_ratios=None):
    """Create a styled table with header + rows."""
    data = [[Paragraph('<b>%s</b>' % h, header_cell_style) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), cell_left if len(str(c)) > 30 else cell_style) for c in row])

    if col_ratios:
        col_widths = [r * CONTENT_W for r in col_ratios]
    else:
        col_widths = [CONTENT_W / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = colors.white if i % 2 == 1 else TABLE_STRIPE
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ── Safe KeepTogether ──
MAX_KEEP = PAGE_H * 0.4
def safe_keep(elements):
    total = 0
    for el in elements:
        try:
            w, h = el.wrap(CONTENT_W, PAGE_H)
            total += h
        except:
            total += 50
    if total <= MAX_KEEP:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)

# ── Build Document ──
OUTPUT = '/home/z/my-project/download/ARPT_Etat_du_Projet_2026.pdf'

doc = TocDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN, bottomMargin=BOTTOM_MARGIN,
    showBoundary=0,
)

story = []

# ── TABLE OF CONTENTS ──
toc = TableOfContents()
toc.levelStyles = [toc_h1, toc_h2]
story.append(Paragraph('<b>Table des matieres</b>', ParagraphStyle(
    name='TOCTitle', fontName=FONT, fontSize=22, leading=28,
    alignment=TA_LEFT, spaceAfter=18, textColor=HEADER_FILL,
)))
story.append(toc)
story.append(PageBreak())

# ════════════════════════════════════════════════
# SECTION 1 - PRESENTATION DU PROJET
# ════════════════════════════════════════════════
story.extend(add_major_section('1. Presentation du Projet ARPT', h1_style))

story.append(Paragraph(
    "L'Autorite de Regulation des Postes et Telecommunications (ARPT) de la Republique de Guinee "
    "a initie le developpement d'une plateforme numerique integree destinee a superviser et reguler "
    "l'ensemble des activites du secteur des telecommunications du pays. Cette plateforme constitue "
    "un outil strategique pour le suivi de la qualite de service (QoS), la gestion des operateurs, "
    "le traitement des reclamations des abonnes, et la production de rapports reglementaires.", body_style))

story.append(Paragraph(
    "Le projet ARPT repose sur une architecture moderne combinant un frontend Next.js et un backend "
    "Express.js, tous deux interfaces avec une base de donnees PostgreSQL via l'ORM Prisma. "
    "La plateforme implemente un systeme d'authentification double (NextAuth + JWT Express), "
    "un controle d'acces base sur les roles (RBAC) avec quatre profils distincts (Directeur General, "
    "Chef de Service, Agent, Operateur), et un ensemble de 28 groupes de routes couvrant l'ensemble "
    "des domaines fonctionnels de la regulation.", body_style))

story.append(Paragraph(
    "Le perimetre fonctionnel couvert par l'application inclut la gestion des operateurs de telecommunications, "
    "le suivi des dossiers et decisions reglementaires, la gestion des declarations et reclamations, "
    "la generation de rapports et modeles de rapports, le suivi de la couverture reseau et des zones blanches, "
    "la configuration des seuils de qualite de service, la gestion des sanctions, la planification des audits, "
    "ainsi que la gestion des parametres systeme et des donnees ouvertes. Chacun de ces modules est expose "
    "via des API RESTful securisees avec validation Zod et autorisation RBAC.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('1.1 Fiche technique du projet', h2_style, level=1))
story.append(Spacer(1, 6))

tech_rows = [
    ['Frontend', 'Next.js 14+ (React), TypeScript, Tailwind CSS'],
    ['Backend', 'Express.js, TypeScript, Prisma ORM'],
    ['Base de donnees', 'PostgreSQL (production), SQLite (developpement)'],
    ['Authentification', 'NextAuth (cookie session) + Express JWT (cookie arpt-session)'],
    ['Autorisation', 'RBAC matriciel : 4 roles x 14 ressources x 4 actions'],
    ['Validation', 'Zod schemas (18+ schemas couvrant toutes les routes POST/PUT)'],
    ['Conteneurisation', 'Docker Compose (frontend + backend + PostgreSQL)'],
    ['Depot source', 'GitHub : github.com/skaba89/arpt_app'],
    ['Modeles Prisma', '33 modeles (backend), 32+ modeles (frontend)'],
    ['Routes API', '28+ groupes de routes RESTful'],
]
story.append(make_table(['Composant', 'Description'], tech_rows, [0.25, 0.75]))
story.append(Paragraph('Tableau 1 - Fiche technique synthetique du projet ARPT', caption_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════════
# SECTION 2 - RESULTATS DE L'AUDIT QA
# ════════════════════════════════════════════════
story.extend(add_major_section('2. Resultats de l\'Audit Qualite', h1_style))

story.append(Paragraph(
    "Un audit qualite exhaustif de bout en bout a ete realise sur l'ensemble de la plateforme ARPT. "
    "Cet audit a couvert les dimensions de securite, de robustesse fonctionnelle, de performance, "
    "d'accessibilite et de qualite du code. Le resultat global est sans appel : la plateforme a recu "
    "le verdict de <b>NON VALIDEE POUR LA PRODUCTION</b>, avec un total de 134 anomalies identifiees "
    "reparties en quatre niveaux de criticite.", body_style))

story.append(Paragraph(
    "La repartition des anomalies par niveau de severite revele une proportion preoccupante de defects "
    "critiques et majeurs, representant ensemble 42% du total des anomalies constatees. Les problemes "
    "de securite dominent les anomalies critiques (absence de validation des entrees, secrets codes en dur, "
    "controle RBAC defaillant), tandis que les anomalies de priorite elevee concernent principalement "
    "des risques d'injection XSS, des crashs a l'execution, et l'absence de pagination sur les endpoints non bornes.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('2.1 Repartition des anomalies par criticite', h2_style, level=1))
story.append(Spacer(1, 6))

audit_rows = [
    ['Critique', '20', '15%', 'Failles de securite majeures, validation absente, secrets exposes'],
    ['Haute', '36', '27%', 'XSS, crashs runtime, pagination absente, CORS permissif'],
    ['Moyenne', '44', '33%', 'Qualite code, accessibilite, etats de chargement manquants'],
    ['Basse', '34', '25%', 'Optimisations, refactorisation, ameliorations mineures'],
]
story.append(make_table(
    ['Severite', 'Nombre', 'Proportion', 'Exemples typiques'],
    audit_rows, [0.13, 0.09, 0.10, 0.68]
))
story.append(Paragraph('Tableau 2 - Repartition des 134 anomalies identifiees par l\'audit QA', caption_style))
story.append(Spacer(1, 14))

story.append(Paragraph(
    "L'audit a egalement souligne plusieurs problemes transversaux affectant l'ensemble de l'application : "
    "l'absence de gestion centralisee des erreurs, des secrets de chiffrement hardcodes dans le code source, "
    "des schemas de validation Zod incomplets ou absents sur de nombreuses routes, une matrice RBAC "
    "incoherente entre le frontend et le backend, et l'absence de protection contre les attaques par "
    "force brute sur les endpoints d'authentification. Ces constats ont motive l'adoption d'une approche "
    "de correction progressive en quatre phases distinctes.", body_style))

# ════════════════════════════════════════════════
# SECTION 3 - PHASE 1 CORRECTIONS CRITIQUES
# ════════════════════════════════════════════════
story.extend(add_major_section('3. Phase 1 - Corrections Critiques (Realisee)', h1_style))

story.append(Paragraph(
    "La premiere phase de correction a cible les 20 anomalies de severite critique identifiees par l'audit. "
    "Ces anomalies representaient des risques directs pour la confidentialite, l'integrite et la disponibilite "
    "des donnees de la plateforme. La correction de ces failles constitue un prerequis indispensable "
    "avant toute mise en production. Deux sessions de travail ont ete necessaires pour couvrir l'ensemble "
    "des points critiques, avec un total de 39 fichiers modifies, 521 insertions et 190 suppressions de lignes.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('3.1 Validation des entrees et prevention de l\'assignement en masse', h2_style, level=1))

story.append(Paragraph(
    "L'audit a revele que 20 routes POST et PUT du backend n'appliquaient aucune validation sur les donnees "
    "entrantes, permettant potentiellement l'assignement en masse (mass assignment). Des attaquants pourraient "
    "exploiter cette faille pour modifier des champs sensibles comme le role d'un utilisateur ou le statut "
    "d'une decision sans autorisation. La correction a consiste a creer 18 schemas de validation Zod "
    "couvrant l'ensemble des routes vulnerables, incluant des validateurs stricts pour les types, longueurs, "
    "et formats de donnees attendus. Les schemas z.any() ont ete remplaces par des validateurs precis "
    "(z.string().max() pour les champs JSON, par exemple).", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('3.2 Durcissement des secrets de chiffrement', h2_style, level=1))

story.append(Paragraph(
    "Les secrets JWT et NEXTAUTH etaient codes en dur dans le code source avec des valeurs faibles "
    "et predictibles ('arpt-guinee-fallback-secret-for-dev-only', 'arpt-guinea-dev-secret-change-in-production-2025'). "
    "La correction a supprime tous les secrets de repli (fallback secrets), genere des cles cryptographiques "
    "fortes (64 octets en base64), et migre toutes les references vers des variables d'environnement "
    "(JWT_SECRET, NEXTAUTH_SECRET, SESSION_SECRET). Le fichier docker-compose.yml a ete mis a jour "
    "pour injecter ces secrets de maniere securisee dans les conteneurs. De plus, le flag de securite "
    "des cookies est desormais configurable via NEXTAUTH_SECURE_COOKIES pour s'adapter aux environnements "
    "de production avec HTTPS.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('3.3 Correction du controle RBAC', h2_style, level=1))

story.append(Paragraph(
    "Plusieurs routes exposaient des operations sensibles sans verification d'autorisation adequat. "
    "Cinq routes de rapports-generes utilisaient erroneement authorize('templates') au lieu de "
    "authorize('rapports-generes'). La route POST /restore des versions utilisait authorize('versions','read') "
    "au lieu de authorize('versions','update'). La route des antennes n'appliquait que requireAuth() "
    "sans verification RBAC. La matrice RBAC a ete corrigee pour ajouter la permission 'update' sur "
    "la ressource 'versions' pour le role 'agent', necessaire pour l'operation de restauration.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('3.4 Limitation du debit (Rate Limiting)', h2_style, level=1))

story.append(Paragraph(
    "L'audit a identifie l'absence totale de protection contre les attaques par force brute et les abus "
    "de l'API. Un middleware de limitation du debit a ete cree avec trois niveaux de protection distincts : "
    "un limiteur global pour l'ensemble des endpoints API (300 requetes par minute), un limiteur specifique "
    "aux endpoints d'authentification (20 requetes par minute), et un limiteur pour les exports de donnees "
    "(30 requetes par tranche de 5 minutes). Ces limites protegent efficacement contre les attaques par "
    "deni de service, les tentatives de brute force sur les mots de passe, et l'extraction massive de donnees.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('3.5 Correction du tableau de bord', h2_style, level=1))

story.append(Paragraph(
    "Le tableau de bord principal affichait une valeur hardcodede pour le delai moyen de traitement "
    "des dossiers (deloiMoyen = 4.2), sans aucun lien avec les donnees reelles. Cette valeur "
    "a ete remplacee par un calcul dynamique base sur les dossiers existants en base de donnees, "
    "garantissant ainsi l'exactitude des indicateurs presentes aux decideurs.", body_style))

# Phase 1 summary table
story.append(Spacer(1, 14))
p1_rows = [
    ['Validation entrees', '20 routes sans validation', '18 schemas Zod, toutes routes couvertes'],
    ['Secrets de chiffrement', 'Secrets hardcodes, fallbacks insecure', 'Env vars, cles 64-byte, plus de fallback'],
    ['Controle RBAC', '5 routes avec autorisation incorrecte', 'Matrice RBAC corrigee, permissions alignees'],
    ['Rate Limiting', 'Aucune protection', '3 niveaux : API 300/min, Auth 20/min, Export 30/5min'],
    ['Tableau de bord', 'deloiMoyen = 4.2 (hardcode)', 'Calcul dynamique depuis la base de donnees'],
]
story.append(make_table(
    ['Domaine', 'Probleme identifie', 'Correction appliquee'],
    p1_rows, [0.20, 0.35, 0.45]
))
story.append(Paragraph('Tableau 3 - Synthese des corrections critiques (Phase 1)', caption_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════════
# SECTION 4 - PHASE 2 CORRECTIONS HAUTE PRIORITE
# ════════════════════════════════════════════════
story.extend(add_major_section('4. Phase 2 - Corrections Haute Priorite (Realisee)', h1_style))

story.append(Paragraph(
    "La deuxieme phase a adresse les 36 anomalies de priorite elevee, couvrant des problemes de securite "
    "complementaires, de stabilite du runtime, et de robustesse architecturale. Ces corrections ont ete "
    "reparties en deux vagues successives, representant au total plus de 1 500 lignes modifiees a travers "
    "34 fichiers. Les corrections apportees dans cette phase renforcent significativement la posture de "
    "securite de la plateforme et elimine les principaux vecteurs d'attaque identifies.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('4.1 Assainissement des entrees et protection XSS', h2_style, level=1))

story.append(Paragraph(
    "Un middleware d'assainissement automatique a ete implemente pour strip les balises HTML, les gestionnaires "
    "d'evenements JavaScript (onclick, onerror, etc.), les URIs javascript: et data: de toutes les entrees "
    "utilisateur sur les requetes POST, PUT, PATCH et DELETE. Cette protection s'applique globalement "
    "apres le parsing du body, garantissant qu'aucune donnee malveillante ne puisse atteindre les handlers "
    "de routes. En complement, une vulnerabilite XSS dans le composant chatbot a ete corrigee par "
    "l'integration de DOMPurify pour assainir le contenu HTML avant son rendu dans le navigateur.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('4.2 Securite des sessions et authentification', h2_style, level=1))

story.append(Paragraph(
    "Plusieurs ameliorations majeures ont ete apportees au systeme d'authentification. Le type du champ "
    "User.role a ete converti de String a enum Prisma (Role { dg, agent, operateur, public }), "
    "garantissant au niveau de la base de donnees que seuls les roles valides peuvent etre attribues. "
    "Une attaque temporelle sur la verification des sessions a ete eliminee en utilisant "
    "crypto.timingSafeEqual pour la comparaison des tokens, empechant toute attaque par canal auxiliaire. "
    "Les tokens JWT en liste noire sont desormais persistes en base de donnees (modele BlockedToken) "
    "plutot qu'en memoire, assurant leur invalidation meme apres un redemarrage du serveur.", body_style))

story.append(Paragraph(
    "Un mecanisme de changement obligatoire du mot de passe a ete ajoute via le champ "
    "doitChangerMotDePasse sur le modele User (defaut: true). Lors de la connexion, si ce champ "
    "est actif, l'utilisateur est redirige vers l'ecran de changement de mot de passe avant tout "
    "acces a l'application. Ce mecanisme garantit que tous les comptes par defaut sont forces "
    "a personnaliser leur mot de passe lors de la premiere connexion.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('4.3 Gestion centralisee des erreurs', h2_style, level=1))

story.append(Paragraph(
    "L'audit a constate l'absence de gestion uniforme des erreurs a travers les 28 groupes de routes. "
    "Chaque handler de route implementait sa propre logique try/catch avec des formats de reponse "
    "incoherents. Un utilitaire asyncHandler a ete cree pour encapsuler automatiquement les handlers "
    "asynchrones, capturant les erreurs non gerees et retournant des reponses au format standardise. "
    "Cela garantit que toutes les erreurs de l'API retournent un format JSON coherent incluant le code "
    "d'erreur, le message, et le timestamp de l'incident.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('4.4 Pagination, CORS et securite des cookies', h2_style, level=1))

story.append(Paragraph(
    "L'ensemble des endpoints retournant des listes non bornees a ete dote de parametres de pagination "
    "(limit/offset) pour prevenir les denis de service par requetes massives et optimiser les performances "
    "de l'API. La configuration CORS a ete renforcee avec une liste blanche stricte des origines autorisees, "
    "rejetant les origines inconnues avec un log d'avertissement. Le debug endpoint /api/debug/ a ete "
    "retire des exemptions de rate limiting, et les headers de securite HSTS ont ete ajoutes pour "
    "forcer les connexions HTTPS en production. Les cookies de session beneficient desormais des attributs "
    "Secure, HttpOnly et SameSite=Strict de maniere systematique.", body_style))

story.append(Spacer(1, 12))
story.append(add_heading('4.5 Stabilite de l\'interface utilisateur', h2_style, level=1))

story.append(Paragraph(
    "Trois crashs runtime causes par des references a des proprietes indefinies (pag undefined) ont ete "
    "corriges dans les composants de pagination. Le composant PaginationBar a ete reecrit avec React.memo, "
    "un displayName explicite, et des exports doubles pour une meilleure compatibilite. Un composant "
    "SectionErrorBoundary a ete ajoute, enveloppant les 27 cas de vue dans le composant principal de "
    "l'application, garantissant qu'une erreur dans une section n'entraine pas l'ecran blanc de l'ensemble "
    "de l'interface. Des regles CSS responsives pour mobile ont ete ajoutees (grille empilable, prevention "
    "des debordements), et la mise en page de la page de connexion a ete corrigee pour les ecrans desktop.", body_style))

# Phase 2 summary table
story.append(Spacer(1, 14))
p2_rows = [
    ['Assainissement XSS', 'Injection HTML/JS possible', 'Middleware sanitize + DOMPurify'],
    ['Enum Role Prisma', 'User.role = String (non contraint)', 'Enum Role { dg, agent, operateur, public }'],
    ['Attaque temporelle', 'Comparaison tokens non constante', 'crypto.timingSafeEqual'],
    ['JWT blocklist', 'Tokens en memoire volatile', 'Modele BlockedToken en BDD'],
    ['Changement mot de passe', 'Pas de rotation initiale', 'doitChangerMotDePasse (defaut: true)'],
    ['Gestion erreurs', 'try/catch incoherents', 'asyncHandler centralise'],
    ['Pagination API', 'Endpoints non bornes', 'limit/offset sur tous les endpoints'],
    ['CORS', 'Origines permissives', 'Whitelist stricte + log rejets'],
    ['HSTS & cookies', 'Headers manquants', 'HSTS + Secure + HttpOnly + SameSite'],
    ['UI stability', '3 crashs runtime, pas de fallback', 'React.memo + ErrorBoundary + CSS mobile'],
    ['Indexes BDD', '18+ indexes manquants', 'Indexes sur User.role, Declaration, etc.'],
    ['Fichiers morts', 'proxy.ts inutilise', 'Supprime'],
]
story.append(make_table(
    ['Domaine', 'Probleme identifie', 'Correction appliquee'],
    p2_rows, [0.22, 0.35, 0.43]
))
story.append(Paragraph('Tableau 4 - Synthese des corrections haute priorite (Phase 2)', caption_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════════
# SECTION 5 - PHASE 3 CORRECTIONS MOYENNE PRIORITE
# ════════════════════════════════════════════════
story.extend(add_major_section('5. Phase 3 - Corrections Moyenne Priorite (En cours)', h1_style))

story.append(Paragraph(
    "La phase 3 cible les 44 anomalies de priorite moyenne, representant le tiers des defects identifies. "
    "Ces anomalies n'affectent pas directement la securite ou la stabilite de l'application, mais "
    "impactent significativement la qualite du code, l'experience utilisateur, et la maintenabilite "
    "a long terme de la plateforme. Les corrections de cette phase sont estimees a environ 20 heures "
    "de travail et constituent une etape essentielle avant la mise en production.", body_style))

story.append(Paragraph(
    "Les categories principales d'anomalies moyenne priorite incluent l'amelioration de la qualite du "
    "code TypeScript (typage incomplet, any implicites), l'ajout d'etats de chargement et de messages "
    "d'erreur contextuels dans les composants frontend, l'amelioration de l'accessibilite (contraste, "
    "navigation clavier, labels ARIA), la reduction de la duplication de code entre les composants, "
    "l'optimisation des requetes base de donnees (N+1 queries), et l'ajout de tests unitaires pour "
    "les fonctions critiques du backend.", body_style))

p3_rows = [
    ['Qualite du code', '12', 'Typage TypeScript incomplet, any implicites, duplication'],
    ['Etats de chargement', '8', 'Absence de spinners/skeletons pendant les appels API'],
    ['Accessibilite', '7', 'Contraste insuffisant, labels ARIA manquants, navigation clavier'],
    ['Performance', '6', 'N+1 queries, re-rendus inutiles React, bundles non optimises'],
    ['Messages d\'erreur', '5', 'Messages generiques, pas de guidance utilisateur'],
    ['Tests unitaires', '4', 'Couverture de tests inferieure a 10%'],
    ['Documentation API', '2', 'Endpoints non documentes, schemas OpenAPI absents'],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['Categorie', 'Nombre', 'Description des anomalies'],
    p3_rows, [0.20, 0.09, 0.71]
))
story.append(Paragraph('Tableau 5 - Repartition des anomalies de priorite moyenne (Phase 3)', caption_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════════
# SECTION 6 - PHASE 4 AMELIORATIONS CONTINUES
# ════════════════════════════════════════════════
story.extend(add_major_section('6. Phase 4 - Ameliorations Continues (A venir)', h1_style))

story.append(Paragraph(
    "La phase 4 regroupe les 34 anomalies de priorite basse, representant les ameliorations souhaitables "
    "mais non bloquantes pour la mise en production. Ces items incluent des optimisations de performance "
    "avancees, de la refactorisation de code pour une meilleure maintenabilite, l'ajout de fonctionnalites "
    "cosmetiques, et des ameliorations de l'experience developpeur. L'estimation de travail pour cette "
    "phase est d'environ 10 heures. Bien que ces ameliorations puissent etre differees apres le lancement, "
    "elles contribuent a la qualite a long terme et a la dette technique du projet.", body_style))

story.append(Paragraph(
    "Parmi les ameliorations prevues, on compte la mise en cache des requetes frequentes (Redis), "
    "l'optimisation des images et assets statiques, la refactorisation des composants React dupliques "
    "en composants partages, l'ajout de logs structures pour le monitoring en production, l'implementation "
    "d'un systeme de notifications en temps reel (WebSocket), et la completion de la documentation "
    "technique et fonctionnelle de l'application.", body_style))

story.append(Spacer(1, 18))

# ════════════════════════════════════════════════
# SECTION 7 - METRIQUES CLES
# ════════════════════════════════════════════════
story.extend(add_major_section('7. Metriques Cles et Avancement Global', h1_style))

story.append(Paragraph(
    "Le suivi de l'avancement des corrections est essentiel pour evaluer la proximite de la plateforme "
    "avec les exigences de mise en production. Les metriques ci-dessous presentent l'etat actuel du "
    "projet en termes de corrections realisees, d'effort investi, et de travail restant. Sur les 134 "
    "anomalies initiales, 56 ont ete corrigees a l'issue des phases 1 et 2, representant 42% du total "
    "et la quasi-totalite des anomalies critiques et haute priorite.", body_style))

metrics_rows = [
    ['Anomalies totales identifiees', '134', '-'],
    ['Anomalies corrigees (Phase 1 + 2)', '56', '42%'],
    ['Anomalies critiques corrigees', '20 / 20', '100%'],
    ['Anomalies haute priorite corrigees', '36 / 36', '100%'],
    ['Anomalies moyenne priorite restantes', '44', 'Phase 3 en cours'],
    ['Anomalies basse priorite restantes', '34', 'Phase 4 a venir'],
    ['Fichiers modifies (Phase 1)', '39', '521 insertions, 190 suppressions'],
    ['Fichiers modifies (Phase 2)', '34', '1 500+ lignes modifiees'],
    ['Schemas Zod ajoutes', '18', 'Couverture complete des routes'],
    ['Indexes base de donnees ajoutes', '18+', 'User.role, Declaration, Notification, etc.'],
    ['Commits pousses sur GitHub', '4', '4215d5b, 1346ea8, b9333ff, 5365665'],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['Indicateur', 'Valeur', 'Remarque'],
    metrics_rows, [0.38, 0.18, 0.44]
))
story.append(Paragraph('Tableau 6 - Metriques cles du projet ARPT', caption_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════════
# SECTION 8 - PROCHAINES ETAPES
# ════════════════════════════════════════════════
story.extend(add_major_section('8. Prochaines Etapes et Feuille de Route', h1_style))

story.append(Paragraph(
    "La feuille de route du projet ARPT definit les prochaines etapes necessaires pour atteindre le "
    "niveau de qualite requis pour la mise en production. L'objectif prioritaire est l'achevement de "
    "la Phase 3 (44 anomalies moyenne priorite), qui permettra de lever la majorite des obstacles "
    "restants a la mise en service. La Phase 4 pourra etre menee en parallele avec les premiers "
    "deploiements en environnement de pre-production.", body_style))

steps_rows = [
    ['1', 'Achevement Phase 3', 'Correction des 44 anomalies moyenne priorite', '~20h', 'Priorite maximale'],
    ['2', 'Tests de regression', 'Validation que les corrections n\'introduisent pas de regressions', '~8h', 'Apres Phase 3'],
    ['3', 'Audit de securite post-correction', 'Verification que toutes les failles sont colmatees', '~6h', 'Apres tests'],
    ['4', 'Phase 4 (ameliorations)', 'Correction des 34 anomalies basse priorite', '~10h', 'En parallele'],
    ['5', 'Deploiement pre-production', 'Mise en service en environnement de staging', '~4h', 'Apres audit'],
    ['6', 'Formation utilisateurs', 'Formation des agents ARPT a la plateforme', '~8h', 'Apres deploiement'],
    ['7', 'Mise en production', 'Deploiement en environnement de production', '~4h', 'Decision DG'],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['Etape', 'Action', 'Description', 'Effort', 'Dependance'],
    steps_rows, [0.06, 0.18, 0.40, 0.10, 0.26]
))
story.append(Paragraph('Tableau 7 - Feuille de route du projet ARPT', caption_style))
story.append(Spacer(1, 18))

story.append(Paragraph(
    "L'effort total restant est estime a environ 60 heures de travail, reparties entre les corrections "
    "de la Phase 3 (20h), les tests de regression (8h), l'audit post-correction (6h), la Phase 4 (10h), "
    "le deploiement (4h), et la formation (8h). En mobilisant les ressources adequates, la mise en "
    "production pourrait etre envisagee dans un delai de 3 a 4 semaines, sous reserve de la validation "
    "de l'audit de securite post-correction et de l'approbation formelle du Directeur General de l'ARPT.", body_style))

# ── BUILD ──
doc.multiBuild(story)
print(f"PDF body generated: {OUTPUT}")
