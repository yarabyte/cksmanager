-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : dim. 03 mai 2026 à 15:37
-- Version du serveur : 8.0.45-0ubuntu0.24.04.1
-- Version de PHP : 8.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `cksmanager`
--

-- --------------------------------------------------------

--
-- Structure de la table `conditionnements`
--

CREATE TABLE `conditionnements` (
  `id` bigint UNSIGNED NOT NULL,
  `libelle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_common` tinyint(1) NOT NULL DEFAULT '1',
  `rank` smallint NOT NULL DEFAULT '100',
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `conditionnements`
--

INSERT INTO `conditionnements` (`id`, `libelle`, `is_common`, `rank`, `actif`, `created_at`, `updated_at`) VALUES
(11, 'Boîte', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(12, 'Tube', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(13, 'Flacon', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(14, 'Ampoule', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(15, 'Blister', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(16, 'Autre', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(17, 'Pot', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(18, 'Sachet', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(19, 'Poche', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(20, 'Seringue préremplie', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(21, 'Aérosol', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(22, 'Cartridge', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(23, 'Pulvérisateur', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(26, 'test henri', 1, 101, 1, '2025-12-08 11:44:46', '2025-12-08 11:53:02'),
(27, 'Comprimé', 1, 100, 1, '2026-02-17 08:34:54', '2026-02-17 08:34:54'),
(28, 'Aiguille', 1, 100, 1, '2026-02-17 08:37:13', '2026-02-17 08:37:13'),
(29, 'Suppositoire', 1, 100, 1, '2026-02-17 15:01:50', '2026-02-17 15:01:50'),
(30, 'Plaquette', 1, 100, 1, '2026-03-03 08:34:03', '2026-03-03 08:34:03');

-- --------------------------------------------------------

--
-- Structure de la table `formes_galeniques`
--

CREATE TABLE `formes_galeniques` (
  `id` bigint UNSIGNED NOT NULL,
  `libelle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_common` tinyint(1) NOT NULL DEFAULT '1',
  `rank` smallint NOT NULL DEFAULT '100',
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `formes_galeniques`
--

INSERT INTO `formes_galeniques` (`id`, `libelle`, `is_common`, `rank`, `actif`, `created_at`, `updated_at`) VALUES
(20, 'Comprimé', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(21, 'Gélule', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(22, 'Comprimé effervescent', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(23, 'Capsule', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(24, 'Aérosol', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(25, 'Sirop', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(26, 'Comprimé à croquer', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(27, 'Autre', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(28, 'Solution injectable', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(29, 'Suppositoire', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(30, 'Crème', 1, 100, 1, '2025-08-25 05:12:42', '2025-08-25 05:12:42'),
(31, 'Compresse', 1, 100, 1, NULL, NULL),
(32, 'Aiguille', 1, 100, 1, NULL, NULL),
(33, 'Flapule', 1, 100, 1, NULL, NULL),
(34, 'Baby haler', 1, 100, 1, NULL, NULL),
(36, 'Champs abdominal', 1, 100, 1, NULL, NULL),
(37, 'Sonde urinaire', 1, 100, 1, NULL, NULL),
(38, 'Poche', 1, 100, 1, NULL, NULL),
(39, 'Masque', 1, 100, 1, NULL, NULL),
(40, 'Prolongateur', 1, 100, 1, NULL, NULL),
(41, 'Kit APD', 1, 100, 1, NULL, NULL),
(42, 'Solution cutanée', 1, 100, 1, '2026-02-17 15:14:31', '2026-02-17 15:14:31'),
(43, 'Ampoule', 1, 100, 1, '2026-03-03 09:02:33', '2026-03-03 09:02:33'),
(44, 'Sachet', 1, 100, 1, '2026-03-03 09:54:23', '2026-03-03 09:54:23'),
(45, 'Blister', 1, 100, 1, '2026-03-04 08:23:35', '2026-03-04 08:23:35');

-- --------------------------------------------------------

--
-- Structure de la table `fournisseurs`
--

CREATE TABLE `fournisseurs` (
  `id` bigint UNSIGNED NOT NULL,
  `raison_sociale` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `fournisseurs`
--

INSERT INTO `fournisseurs` (`id`, `raison_sociale`, `adresse`, `telephone1`, `telephone2`, `email`, `actif`, `created_at`, `updated_at`) VALUES
(1, 'CFAO Pharma Cameroun', 'Douala – Bonapriso', '+237 233 12 34 56', '+237 699 11 22 33', 'contact@cfaopharma.cm', 1, '2025-08-12 20:56:41', '2026-03-12 14:56:54'),
(2, 'Laborex Cameroun', 'Yaoundé – Mvan', '+237 222 45 67 89', '+237 677 88 99 00', 'info@laborex.cm', 1, '2025-08-12 20:56:41', '2025-08-12 20:56:41'),
(3, 'UBIPHARM Cameroun', 'Douala – Akwa', '+237 233 44 55 66', '+237 691 22 33 44', 'service@ubipharm.cm', 1, '2025-08-12 20:56:41', '2025-08-12 20:56:41'),
(4, 'Médic Plus Distribution', 'Douala – Bali', '+237 233 77 88 99', NULL, 'sales@medicplus.cm', 1, '2025-08-12 20:56:41', '2025-08-12 20:56:41'),
(5, 'Pharma Express Logistics', 'Yaoundé – Nlongkak', '+237 222 11 22 33', '+237 699 55 66 77', 'hello@pharmaexpress.cm', 1, '2025-08-12 20:56:41', '2025-08-12 20:56:41'),
(6, 'SINOPHAMARM', NULL, NULL, NULL, NULL, 1, '2026-03-11 15:42:40', '2026-03-11 15:42:40');

-- --------------------------------------------------------

--
-- Structure de la table `produits`
--

CREATE TABLE `produits` (
  `id` bigint UNSIGNED NOT NULL,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `principe_actif` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code_cip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `forme_galenique_id` bigint UNSIGNED NOT NULL,
  `dosage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `conditionnement_id` bigint UNSIGNED NOT NULL,
  `qte_par_conditionnement` int UNSIGNED NOT NULL,
  `prix_achat_ref` decimal(12,2) NOT NULL DEFAULT '0.00',
  `prix_vente_ref` decimal(12,2) NOT NULL DEFAULT '0.00',
  `hnc` decimal(12,2) DEFAULT NULL COMMENT 'Honoraire Non Conventionné (prix libre hors convention)',
  `qte_alerte` int UNSIGNED NOT NULL DEFAULT '0',
  `assureur_id` bigint UNSIGNED DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `produits`
--

INSERT INTO `produits` (`id`, `nom`, `principe_actif`, `code_cip`, `forme_galenique_id`, `dosage`, `conditionnement_id`, `qte_par_conditionnement`, `prix_achat_ref`, `prix_vente_ref`, `hnc`, `qte_alerte`, `assureur_id`, `actif`, `created_at`, `updated_at`) VALUES
(2, 'Amoxicilline 500mg', 'Amoxicilline', '987654321', 21, '500mg', 27, 1, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-05-30 13:25:46', '2026-02-17 08:50:36'),
(3, 'Ibuprofène 400mg boîte/10x10 FOURRTS', 'Ibuprofène', '654321987', 20, '400mg', 11, 30, 700.00, 1000.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-06-14 07:42:03'),
(4, 'Vitamine C 1000mg', 'Acide ascorbique', '321987654', 22, '1000mg', 12, 20, 900.00, 1300.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(5, 'Oméprazole 20mg', 'Oméprazole', '111222333', 21, '20mg', 11, 28, 1500.00, 2000.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(6, 'Azithromycine 500mg', 'Azithromycine', '444555666', 20, '500mg', 11, 3, 2500.00, 4000.00, NULL, 1, NULL, 1, '2025-05-30 13:25:46', '2026-02-17 09:12:14'),
(7, 'Loratadine 10mg', 'Loratadine', '777888999', 20, '10mg', 11, 10, 600.00, 1000.00, NULL, 5, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 17:19:21'),
(8, 'Fer + Vitamines', 'Vitamines', '159753486', 23, 'Capsule', 11, 1, 1800.00, 2200.00, NULL, 5, NULL, 1, '2025-05-30 13:25:46', '2026-03-04 08:19:07'),
(9, 'Cétirizine 10mg', 'Cétirizine', '951357852', 20, '10mg', 11, 20, 800.00, 1200.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(11, 'Vitamine D3', 'Cholécalciférol', '147258369', 25, '400 UI/ml', 13, 15, 5000.00, 6000.00, NULL, 5, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 17:12:41'),
(12, 'Metformine 850mg', 'Metformine', '369258147', 20, '850mg', 11, 30, 1500.00, 2000.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(13, 'Losartan 50mg', 'Losartan', '258369147', 20, '50mg', 11, 30, 2000.00, 2500.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(14, 'Simvastatine 20mg', 'Simvastatine', '147369258', 20, '20mg', 11, 30, 2200.00, 2700.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(15, 'Diclofénac 50mg', 'Diclofénac', '369147258', 20, '50mg', 15, 10, 350.00, 500.00, NULL, 1, NULL, 1, '2025-05-30 13:25:46', '2026-02-17 15:00:09'),
(16, 'Tramadol 50mg', 'Tramadol', '258147369', 20, '50mg', 11, 20, 2800.00, 3300.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(17, 'Acide folique 5mg', 'vitamine B9', '987123654', 20, '5mg', 11, 20, 500.00, 500.00, NULL, 5, NULL, 1, '2025-05-30 13:25:46', '2026-01-08 06:55:31'),
(18, 'Calcium + Vit D3', 'Calcium, Vit D3', '654987321', 26, '500mg', 27, 10, 1800.00, 2500.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2026-02-17 09:21:49'),
(19, 'Ranitidine 150mg', 'Ranitidine', '321654987', 20, '150mg', 11, 20, 1600.00, 2000.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(20, 'Ciprofloxacine 500mg', 'Ciprofloxacine', '852741963', 20, '500mg', 11, 10, 2200.00, 2700.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(21, 'Acétaminophène + Codéine', 'Acétaminophène, Codéine', '963852741', 20, '300mg/30mg', 27, 1, 0.00, 0.00, NULL, 0, NULL, 0, '2025-05-30 13:25:46', '2026-02-17 08:35:31'),
(22, 'Dompéridone 10mg', 'Dompéridone', '741963852', 20, '10mg', 11, 30, 1300.00, 1800.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(23, 'Clarithromycine 500mg', 'Clarithromycine', '852963741', 20, '500mg', 11, 1, 3500.00, 4000.00, NULL, 1, NULL, 1, '2025-05-30 13:25:46', '2026-03-04 09:01:39'),
(24, 'Amlodipine 5mg bte/30', 'Amlodipine', '963741852', 20, '5mg', 15, 10, 1800.00, 5000.00, NULL, 1, NULL, 1, '2025-05-30 13:25:46', '2026-02-17 08:47:54'),
(25, 'Hydrochlorothiazide 25mg', 'Hydrochlorothiazide', '147852963', 20, '25mg', 11, 30, 1400.00, 1800.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(26, 'Levothyroxine 50mcg', 'Levothyroxine', '258963741', 20, '50mcg', 11, 30, 1900.00, 2300.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(27, 'Spironolactone 25mg', 'Spironolactone', '741852963', 20, '25mg', 11, 30, 2000.00, 2400.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(28, 'Clopidogrel 75mg', 'Clopidogrel', '963258741', 20, '75mg', 11, 28, 3000.00, 3500.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(29, 'Bisoprolol 5mg', 'Bisoprolol', '159486753', 20, '5mg', 11, 30, 2200.00, 3500.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2026-02-17 09:20:06'),
(30, 'Fluconazole 150mg', 'Fluconazole', '753486159', 23, '150mg', 11, 1, 3500.00, 4000.00, NULL, 0, NULL, 1, '2025-05-30 13:25:46', '2025-05-30 13:25:46'),
(31, 'Milimox', 'Mill', '933', 21, '10mg', 11, 30, 1500.00, 2000.00, NULL, 0, NULL, 1, '2025-05-30 13:41:01', '2025-05-30 13:41:01'),
(32, 'Alcool éthylique 70°', 'Ethanol', NULL, 27, 'flapule', 13, 1, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-06-05 13:57:07', '2025-10-15 12:30:35'),
(33, 'Valium 10Mg/2mL injectable boite/6', 'Diazepam', NULL, 28, '10mg/2ml', 14, 1, 700.00, 2500.00, NULL, 5, NULL, 1, '2025-06-07 05:15:18', '2025-10-15 15:37:20'),
(34, 'Fer+ Acide folique Cp Boite/10X10 SAVORITE', 'vitamine B9', NULL, 20, 'mg', 11, 1, 10.00, 200.00, NULL, 1, NULL, 1, '2025-06-07 05:36:31', '2025-10-07 11:37:10'),
(35, 'Glosunate 60 mg injection IM/IV', 'Artesunate', NULL, 28, '60 mg', 13, 1, 825.00, 2800.00, NULL, 30, NULL, 1, '2025-06-10 13:21:19', '2026-02-17 15:24:35'),
(37, 'Genpar paracétamol infusion 1,0/w/v boîte/100ml', 'paracétamol', NULL, 28, 'ml', 13, 170, 1000.00, 750.00, NULL, 1, NULL, 1, '2025-06-10 14:11:35', '2025-10-10 07:35:47'),
(38, 'Artemether-lumifantrine dispersible 20/120 SHANDONG YIKANG', 'Artemether', NULL, 20, '20/120', 11, 30, 1500.00, 2000.00, NULL, 1, NULL, 1, '2025-06-10 14:24:24', '2026-02-17 08:56:48'),
(39, 'Parapro suspension buvable 125ml/5ml', 'paracetamol', NULL, 25, '125ml/5ml', 13, 1, 700.00, 1500.00, NULL, 5, NULL, 1, '2025-06-10 14:30:13', '2025-10-15 14:03:16'),
(40, 'Calcium gluconate injection 1g/10ml(IV)', 'calcium', NULL, 28, '1G', 14, 1, 100.00, 350.00, NULL, 10, NULL, 1, '2025-06-10 15:13:41', '2026-02-17 14:45:01'),
(41, 'Lovenox solution injectable SC/IV  4000UI(40mg)/0,4ml', 'enoxaparine', NULL, 28, 'ml', 13, 1, 4000.00, 6000.00, NULL, 1, NULL, 1, '2025-06-10 15:52:34', '2026-03-16 14:55:04'),
(42, 'Tongue depressor  boîte/100 taille/6 LENGTH', 'Abaisse langue', NULL, 27, 'Unité', 11, 18, 50.00, 100.00, NULL, 5, NULL, 1, '2025-06-10 16:03:10', '2025-10-13 15:51:09'),
(43, 'Glucose 5% flacon/250ml', 'Glucose', NULL, 28, '250 ml', 15, 1, 500.00, 1000.00, NULL, 30, NULL, 1, '2025-06-10 16:09:28', '2026-03-03 10:17:27'),
(44, 'Perfadis 10mg/ml 1g(IV) flacon/100ml', 'Paracetamol 1G IV', NULL, 28, '10 mg/ml', 13, 1, 700.00, 2500.00, NULL, 50, NULL, 1, '2025-06-11 09:50:57', '2026-02-17 15:20:35'),
(46, 'Eau pour préparation injectable sans pyrogène flacon/10ml', 'injection', NULL, 28, '10ml', 14, 1, 35.00, 250.00, NULL, 5, NULL, 1, '2025-06-11 10:03:24', '2026-02-17 15:11:09'),
(47, 'Seringue 1ml(insuline)  30Gx5/16', 'Seringue', NULL, 27, 'ml', 16, 1, 35.00, 100.00, NULL, 5, NULL, 1, '2025-06-11 10:10:54', '2025-10-15 12:24:28'),
(48, 'Epicrânien 23G(bleu)', 'epicranien', NULL, 45, 'unite', 11, 1, 50.00, 250.00, NULL, 20, NULL, 1, '2025-06-11 10:18:08', '2026-03-04 08:30:46'),
(50, 'Epicrânien 25G(orange) boîte/100', 'epicranien', NULL, 45, 'unite', 11, 1, 50.00, 250.00, NULL, 20, NULL, 1, '2025-06-11 10:23:58', '2026-03-04 08:38:43'),
(51, 'Lumaglobe 20/120 boîte/24 artemether+lumefantrine', 'Artemether 20+lumefantrine 120', NULL, 20, 'Comprimé', 11, 2, 950.00, 2900.00, NULL, 5, NULL, 1, '2025-06-11 10:28:51', '2026-03-11 09:09:18'),
(52, 'Redin PN liquide fer calcium protéine et minéraux boîte/200ml FOURRTS', 'Fer vit b9', NULL, 25, 'Ml', 13, 5, 1000.00, 1500.00, NULL, 5, NULL, 1, '2025-06-11 10:34:16', '2025-10-13 12:22:35'),
(53, 'Glomet métronidazole suspension orale 125mg/5ml flacon/100ml', 'Métronidazole', NULL, 25, 'ml', 13, 9, 850.00, 2900.00, NULL, 1, NULL, 1, '2025-06-11 10:39:59', '2026-03-03 10:29:12'),
(54, 'Metropro suspension orale 125mg/5ml', 'Metronidazole', NULL, 25, '100 ml', 11, 10, 850.00, 1500.00, NULL, 2, NULL, 1, '2025-06-11 10:45:17', '2026-03-03 08:28:22'),
(55, 'Ibuzone plus suspension flacon/100ml ZEE', 'Ibuprofen paracétamol suspension orale', NULL, 25, 'Ml', 13, 7, 700.00, 1500.00, NULL, 5, NULL, 1, '2025-06-11 10:50:55', '2025-10-13 10:17:44'),
(56, 'Ferrous folic sulfate ferreux et d\'acide folique séchés boîte/10x10', 'Vitamine B9', NULL, 20, 'plaquet', 11, 800, 10.00, 100.00, NULL, 1, NULL, 1, '2025-06-11 10:56:22', '2026-03-04 08:02:39'),
(57, 'SRO +ZINC 2sachets de sels de réhydratation orale ,10cp de sulfate de zinc soluble FLAVOURED', 'Sel de réhydratation+zinc', NULL, 20, '2 sachets + 10 cps', 15, 1, 500.00, 1700.00, NULL, 5, NULL, 1, '2025-06-11 11:03:48', '2026-02-17 15:10:23'),
(59, 'albendazole suspension orale 400mg/10ml flacon/10ml', 'albendazole', NULL, 25, '400mg/10ml', 13, 1, 550.00, 1000.00, NULL, 5, NULL, 1, '2025-06-11 11:14:48', '2026-02-17 08:39:14'),
(60, 'albendazole 400mg', 'albendazole', NULL, 20, 'Comprimé', 27, 1, 400.00, 1000.00, NULL, 5, NULL, 1, '2025-06-11 11:18:19', '2026-02-17 08:38:50'),
(61, 'Masque  facial  boîte/50', 'Masque', NULL, 38, 'Unité', 15, 50, 50.00, 250.00, NULL, 25, NULL, 1, '2025-06-11 11:23:14', '2026-03-03 08:14:08'),
(63, 'Perfuseurs de précision avec réservoir 150ml', 'perfuseur', NULL, 27, 'autre', 12, 13, 1500.00, 2000.00, NULL, 1, NULL, 1, '2025-06-11 11:33:23', '2025-06-11 11:34:59'),
(64, 'Pots a sels', 'Pot', NULL, 23, 'Unité', 17, 320, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-06-11 11:37:41', '2025-10-13 12:11:07'),
(65, 'Tube EDTA.K3  stérile  non sèches 4ml(violette) SHANGHAI ORSIN', 'prélèvement', NULL, 27, 'ml', 12, 85, 25.00, 500.00, NULL, 1, NULL, 1, '2025-06-11 11:46:00', '2025-06-11 11:46:00'),
(66, 'Tube EDTA.K3  0,5ml GRACE', 'prélèvement', NULL, 27, 'ml', 12, 509, 25.00, 500.00, NULL, 1, NULL, 1, '2025-06-11 11:49:35', '2025-06-13 14:32:10'),
(67, 'Tube de coagulation 5ml(bleu) GRACE', 'prélèvement', NULL, 27, 'ml', 12, 92, 25.00, 500.00, NULL, 1, NULL, 1, '2025-06-11 11:54:35', '2025-06-11 11:54:35'),
(68, 'Speculum vaginal  CUSCO D/30mm', 'Speculum', NULL, 27, 'Unité', 12, 1, 100.00, 1500.00, NULL, 5, NULL, 1, '2025-06-11 11:59:04', '2025-10-13 15:41:42'),
(69, 'Speculum vaginal  CUSCO D/35mm', 'Speculum', NULL, 27, 'Unité', 12, 1, 100.00, 1500.00, NULL, 1, NULL, 1, '2025-06-11 12:00:52', '2025-10-13 15:42:37'),
(70, 'Speculum vaginal  CUSCO D/24', 'Speculum', NULL, 27, 'Unité', 12, 1, 1000.00, 1500.00, NULL, 5, NULL, 1, '2025-06-11 12:03:52', '2025-10-13 15:40:24'),
(71, 'Speculum vaginal  CUSCO D/20', 'Speculum', NULL, 27, 'Unité', 12, 1, 1000.00, 1500.00, NULL, 5, NULL, 1, '2025-06-11 12:05:29', '2025-10-13 15:37:39'),
(73, 'Aquamol 20/120ml poudre pour suspension flacon/60ml', 'artemether+lumefantrine', NULL, 25, '60 ml', 11, 1, 1500.00, 3000.00, NULL, 1, NULL, 1, '2025-06-11 12:15:03', '2026-02-17 08:52:28'),
(74, 'Fogyl 125ml suspension orale flacon/100ml FOURRTS', 'Métronidazol', NULL, 25, 'ml', 11, 1, 750.00, 2900.00, NULL, 1, NULL, 1, '2025-06-11 12:22:55', '2026-03-03 11:00:22'),
(75, 'Mebfil 100ml suspension orale flacon/30ml FOURRTS', 'Mebendazol', NULL, 25, 'ml', 11, 1, 450.00, 500.00, NULL, 1, NULL, 1, '2025-06-11 12:27:19', '2025-06-11 12:27:19'),
(76, 'Eosine aqueuse 2%flacon/100ml ETS RUTHER', 'Eosine', NULL, 42, 'ml', 13, 1, 1200.00, 1800.00, NULL, 1, NULL, 1, '2025-06-11 12:32:00', '2026-03-04 08:42:54'),
(78, 'Transfuseur', 'Transfuseur', NULL, 38, 'Unité', 12, 1, 200.00, 2000.00, NULL, 5, NULL, 1, '2025-06-11 13:21:31', '2026-03-06 07:52:52'),
(79, 'Perfuseur', 'Perfuseur', NULL, 27, 'unite', 12, 1, 200.00, 1000.00, NULL, 50, NULL, 1, '2025-06-11 13:24:00', '2025-10-31 13:16:46'),
(80, 'Aiguille à Ponction lombaire noire 22G', 'Aiguille', NULL, 27, '1', 28, 1, 5000.00, 7000.00, NULL, 5, NULL, 1, '2025-06-11 13:26:53', '2026-02-17 08:37:46'),
(83, 'Métronidazol 250mg boîte/10x10 NINGDO SHUANNGWEI PHARM', 'métronidazole', NULL, 20, 'plaquette', 11, 10, 1000.00, 1500.00, NULL, 0, NULL, 1, '2025-06-11 13:33:28', '2025-06-11 13:33:28'),
(85, 'Seringue 10ml', 'Seringue', NULL, 27, 'ml', 16, 1, 45.00, 100.00, NULL, 5, NULL, 1, '2025-06-11 13:36:23', '2025-10-15 12:14:46'),
(87, 'Catheter 24G jaune', 'catheter', NULL, 27, '1', 16, 1, 100.00, 1000.00, NULL, 10, NULL, 1, '2025-06-11 13:39:58', '2026-02-17 15:36:37'),
(89, 'Vitamine K1 10mg/1ml', 'Vitamine', NULL, 28, 'ml', 14, 10, 450.00, 3500.00, NULL, 2, NULL, 1, '2025-06-11 13:45:03', '2026-03-03 08:50:14'),
(90, 'Lasilix 20mg/2ml boîte/1', 'Furosemide', NULL, 28, 'ml', 11, 1, 1200.00, 1500.00, NULL, 1, NULL, 1, '2025-06-11 13:50:03', '2026-03-03 09:33:37'),
(91, 'Diclo-denk 75 boîte/10 DENK PHARMA', 'Diclofenac', NULL, 28, 'Ml', 14, 6, 200.00, 1500.00, NULL, 5, NULL, 1, '2025-06-11 13:53:51', '2025-10-13 10:10:53'),
(93, 'Amikacin sulphate 500mg/2ml  boîte/1 ABBOTT', 'amikacin', NULL, 28, '500MG/2ML', 14, 1, 500.00, 4000.00, NULL, 5, NULL, 1, '2025-06-11 14:04:08', '2026-02-17 08:44:45'),
(94, 'Gentamicyne collyre 0,3% flacon/10ml', 'Gentamicine', NULL, 45, 'goutte', 13, 1, 600.00, 1000.00, NULL, 2, NULL, 1, '2025-06-11 14:09:26', '2026-03-06 09:41:52'),
(95, 'Nebcine 25mg/2,5ml boîte/1 IV/IM', 'Tobramycine injectable', NULL, 28, 'Ml', 11, 1, 10000.00, 4000.00, NULL, 1, NULL, 1, '2025-06-11 14:13:27', '2025-10-10 10:52:36'),
(96, 'Catheter 22G Bleu', 'catheter', NULL, 27, '1', 16, 1, 100.00, 1000.00, NULL, 10, NULL, 1, '2025-06-11 14:14:56', '2026-02-17 15:47:06'),
(97, 'Catheter 18G Vert', 'catheter', NULL, 27, '1', 16, 1, 100.00, 1000.00, NULL, 10, NULL, 1, '2025-06-11 14:15:58', '2026-02-17 15:47:23'),
(98, 'Mag2 122mg boîte/30 COOPER', 'Magnesium', NULL, 43, 'Ml', 14, 1, 5500.00, 1500.00, NULL, 1, NULL, 1, '2025-06-11 14:17:41', '2026-03-03 09:48:39'),
(100, 'SRO Sachet', 'Sel de réhydration', NULL, 27, '1', 18, 1, 200.00, 1200.00, NULL, 1, NULL, 1, '2025-06-11 14:21:41', '2026-02-18 08:24:23'),
(101, 'Zinc Comprimé', 'Zinc', NULL, 20, 'Comprime', 30, 1, 50.00, 100.00, NULL, 10, NULL, 1, '2025-06-11 14:23:23', '2026-03-03 08:36:19'),
(102, 'Ultra baby Sachet boîte/14 STICK', 'Saccharomyces boulardic', NULL, 27, 'sachet', 18, 6, 200.00, 1200.00, NULL, 5, NULL, 1, '2025-06-11 14:25:34', '2025-10-13 16:04:46'),
(105, 'Ultra-levure Sachet BIOCODEX 250mg boîte/10', 'Microorganisme', NULL, 22, 'sachet', 18, 1, 320.00, 500.00, NULL, 5, NULL, 1, '2025-06-11 14:41:29', '2025-10-15 14:13:56'),
(106, 'Cefuroxime Sodium 750 Mg Injection IV/IM', 'Cefuroxime', NULL, 28, '750mg', 14, 1, 1000.00, 5000.00, NULL, 5, NULL, 1, '2025-06-11 14:56:36', '2026-02-17 15:29:02'),
(107, 'TOT\'hema ampoule buvable boîte/20', 'Gluconate ferreux', NULL, 43, 'Ampoule', 11, 2, 4500.00, 5000.00, NULL, 5, NULL, 1, '2025-06-11 14:56:58', '2026-03-03 09:29:33'),
(108, 'Innclamox DS 312,5mg/5ml flacon/100ml suspension orale', 'Amoxicilline et clavulante de potassium', NULL, 25, 'Ml', 13, 8, 900.00, 1200.00, NULL, 5, NULL, 1, '2025-06-11 15:03:38', '2025-10-13 10:22:15'),
(109, 'Celestène 4mg/1ml solution injectable IV/IM boîte/3', 'bétamethazol', NULL, 28, 'ml', 11, 1, 1200.00, 1500.00, NULL, 1, NULL, 1, '2025-06-11 15:15:55', '2025-06-11 15:15:55'),
(110, 'Celestène 4mg/1ml solution injectable IV/IM boîte/3', 'bétamethazol', NULL, 28, 'ml', 11, 1, 1200.00, 1500.00, NULL, 1, NULL, 1, '2025-06-11 15:17:30', '2025-06-11 15:17:30'),
(114, 'Loxen 20MG CP', 'Nicardipine', NULL, 20, '20MG', 27, 1, 200.00, 500.00, NULL, 5, NULL, 1, '2025-06-11 16:36:38', '2026-02-17 15:09:43'),
(115, 'Glosunate 120MG Injection IV/IM', 'Artesunate', NULL, 28, '120 mg', 13, 1, 825.00, 4000.00, NULL, 30, NULL, 1, '2025-06-11 17:06:48', '2026-02-17 15:25:04'),
(117, 'Omzol 40mg', 'Omeprazole 40mg IV', NULL, 28, '40mg', 13, 1, 700.00, 2000.00, NULL, 30, NULL, 1, '2025-06-12 07:17:01', '2025-10-15 14:07:07'),
(120, 'Hemafer boîte/5 IM UNIPARM', 'Hydroxyde ferrique polymaltose', NULL, 28, 'ml', 14, 5, 2000.00, 4000.00, NULL, 1, NULL, 1, '2025-06-12 07:38:30', '2026-03-03 08:57:24'),
(121, 'Imistatine impenem/cilastatine 500mg/500mg boîte/1 REYOUNG', 'Carbapénèmes', NULL, 28, 'Ml', 13, 2, 200.00, 1000.00, NULL, 5, NULL, 1, '2025-06-12 07:43:01', '2025-10-13 10:20:42'),
(122, 'Ondansetron 8mg/4ml boîte/1 IV', 'Ondansetron', NULL, 28, '8mg/4ml', 14, 1, 1000.00, 2000.00, NULL, 10, NULL, 1, '2025-06-12 07:47:57', '2025-10-18 11:50:50'),
(123, 'Exanex 0,5g/5ml boîte/5 IV', 'solution injectable', NULL, 28, '0,5mg/5ml', 14, 5, 800.00, 3000.00, NULL, 15, NULL, 1, '2025-06-12 07:52:01', '2025-10-25 13:19:37'),
(124, 'Cefazoline 1g IM/IV', 'cefazoline', NULL, 28, '1g', 14, 1, 1200.00, 4000.00, NULL, 10, NULL, 1, '2025-06-12 07:55:33', '2025-10-23 13:58:46'),
(125, 'Intrazoline 1g IM/IV poudre pour solution injectable', 'Cefazoline', NULL, 28, '1g', 14, 1, 1200.00, 4000.00, NULL, 10, NULL, 1, '2025-06-12 07:58:50', '2025-10-23 14:00:19'),
(126, 'Tramadis 100mg/2ml boîte/5 IV/IM', 'Tramadol', NULL, 28, 'Ml', 11, 15, 450.00, 1000.00, NULL, 5, NULL, 1, '2025-06-12 08:09:26', '2025-10-13 15:58:46'),
(127, 'ketoprofen suppositoires boîte/12', 'ketoprofene', NULL, 29, 'ml', 11, 1, 200.00, 500.00, NULL, 12, NULL, 1, '2025-06-12 08:16:17', '2026-03-03 10:12:38'),
(128, 'Prokefen-inject 100mg boîte/1 IV', 'Ketoprofene', NULL, 28, '100 mg', 11, 1, 700.00, 1500.00, NULL, 10, NULL, 1, '2025-06-12 08:19:22', '2025-10-31 13:23:38'),
(129, 'Lidocaîne 2% ADRENALINEE 20mg/ml flacon/50ml', 'Lidocaïne', NULL, 28, '20mg/ml', 13, 1, 2500.00, 5000.00, NULL, 3, NULL, 1, '2025-06-12 08:24:21', '2025-10-21 13:10:26'),
(130, 'Catheter 16G Gris', 'catheter', NULL, 27, '1', 16, 1, 100.00, 1000.00, NULL, 10, NULL, 1, '2025-06-12 08:28:06', '2026-02-17 15:37:48'),
(131, 'Catheter 20G Rose', 'catheter', NULL, 27, '1', 16, 1, 100.00, 1000.00, NULL, 10, NULL, 1, '2025-06-12 08:29:47', '2026-02-17 15:37:14'),
(132, 'Poche à urine 2l', 'Poche', NULL, 38, 'Unité', 19, 1, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-06-12 08:34:32', '2025-10-25 14:06:25'),
(134, 'Gants stériles poudré taille 8', 'Gant', NULL, 38, 'paire', 11, 1, 50.00, 100.00, NULL, 20, NULL, 1, '2025-06-12 08:40:48', '2026-03-03 10:46:06'),
(135, 'Nefopam viatris 20mg/2ml boîte/10 IV/IM', 'Nefopam', NULL, 28, 'Ml', 11, 90, 500.00, 2000.00, NULL, 1, NULL, 1, '2025-06-12 08:44:11', '2025-10-10 10:57:47'),
(136, 'Lidocaîne 2% 20mg/ml flacon/50 ml', 'Lidocaïne', NULL, 28, '20mg/ml', 13, 10, 2500.00, 5000.00, NULL, 3, NULL, 1, '2025-06-12 08:48:17', '2025-10-21 13:09:26'),
(138, 'Gants stériles chirurgicaux poudrés Taille 7,5', 'Gant stérile', NULL, 38, 'paire', 11, 1, 400.00, 750.00, NULL, 20, NULL, 1, '2025-06-12 09:07:47', '2026-03-03 10:57:26'),
(139, 'Seringue 5ml', 'Seringue', NULL, 27, 'ml', 11, 1, 35.00, 100.00, NULL, 1, NULL, 1, '2025-06-12 09:26:18', '2025-11-05 11:56:15'),
(140, 'Seringue 2ml', 'Seringue', NULL, 27, 'ml', 11, 1, 35.00, 100.00, NULL, 5, NULL, 1, '2025-06-12 09:27:26', '2025-10-15 12:17:54'),
(141, 'STERILE GAUZE sponges 45cm paquet/5', 'sponge', NULL, 27, 'unité', 11, 28, 700.00, 1000.00, NULL, 1, NULL, 1, '2025-06-12 09:30:44', '2025-10-08 13:43:49'),
(142, 'Betadine rouge 4% flacon/125ml', 'Povidone iodée', NULL, 42, 'ml', 13, 1, 2000.00, 2500.00, NULL, 5, NULL, 1, '2025-06-12 09:33:43', '2026-03-04 09:40:13'),
(143, 'Betadine jaune 10% flacon/125ml', 'Povidone iodée', NULL, 42, 'ml', 13, 1, 2000.00, 2500.00, NULL, 5, NULL, 1, '2025-06-12 09:35:04', '2026-03-04 09:41:15'),
(145, 'Ephedrine 50mg/1ml SC/IM', 'ephedrine', NULL, 28, '50mg/1ml', 11, 1, 1000.00, 8000.00, NULL, 1, NULL, 1, '2025-06-12 09:44:11', '2025-10-23 13:57:18'),
(146, 'Fentanyl 100mg/2ml IV/IM', 'Fentanyl', NULL, 28, '100mg/2ml', 11, 10, 2500.00, 8000.00, NULL, 5, NULL, 1, '2025-06-12 09:47:01', '2025-10-23 14:05:29'),
(147, 'Oxytocine 10ui/ml flacon/1ml', 'oxytocine', NULL, 28, '10UI/1ml', 14, 1, 500.00, 1500.00, NULL, 10, NULL, 1, '2025-06-12 09:51:28', '2025-10-23 14:31:27'),
(148, 'Magnesium sulfate 500mg/ml flacon/10ml IV/IM KALCEKS', 'Magnesium', NULL, 28, 'Ml', 11, 20, 1500.00, 1800.00, NULL, 1, NULL, 1, '2025-06-12 09:55:09', '2025-10-10 09:59:13'),
(149, 'Ketonal 100mg/2ml boîte/5 IV/IM', 'ketoprofene', NULL, 28, '100', 11, 1, 500.00, 1500.00, NULL, 10, NULL, 1, '2025-06-12 09:58:14', '2025-10-31 13:24:31'),
(150, 'Atropine sulfate 1mg/1ml IV/IM', 'sulfate d\'atropine', NULL, 28, '1mg/1ml', 11, 1, 1000.00, 5000.00, NULL, 5, NULL, 1, '2025-06-12 10:01:20', '2025-10-23 14:38:36'),
(152, 'Cimetidine 200mg/2ml boîte/10 IV/IM', 'cimetidine', NULL, 28, '200 mg', 11, 1, 500.00, 1000.00, NULL, 3, NULL, 1, '2025-06-12 10:08:47', '2025-10-31 13:36:04'),
(153, 'Dexamethasone 4mg/1ml boîte/10 IM/IV', 'Dexamethasone', NULL, 28, '4mg/1ml', 14, 1, 50.00, 1000.00, NULL, 5, 3, 1, '2025-06-12 10:12:24', '2026-02-17 14:48:16'),
(154, 'Diazepan 10mg/2ml boîte/10 IV/IM JUHEL NIGERIA LIMITED', 'Diazepam', NULL, 28, 'Ml', 11, 1, 100000.00, 5000.00, NULL, 5, NULL, 1, '2025-06-12 10:19:19', '2026-03-17 09:30:17'),
(155, 'Midazolam 5mg/3ml', 'Midazolam', NULL, 28, '15mg/3ml', 11, 1, 1500.00, 8000.00, NULL, 5, NULL, 1, '2025-06-12 10:24:05', '2025-10-23 14:43:55'),
(159, 'Chlorure de potassium 10% Injection 1G/10ML', 'Potassium', NULL, 28, '10% 1G/10ML', 14, 1, 200.00, 350.00, NULL, 5, NULL, 1, '2025-06-12 11:48:46', '2026-02-17 15:16:06'),
(161, 'Lovenox  8000 UI', 'Enoxaparine', NULL, 28, '8000 UI', 20, 1, 1500.00, 4500.00, NULL, 1, NULL, 1, '2025-06-12 11:51:48', '2025-10-15 14:30:03'),
(162, 'Ampicilline Sodium Injection 1G IM/IV', 'Ampicilline', NULL, 28, '1G', 14, 1, 800.00, 2500.00, NULL, 5, NULL, 1, '2025-06-12 11:57:55', '2025-10-15 14:18:45'),
(163, 'Chlorure de sodium  10% 1g/10ml', 'Chlorure de sodium', NULL, 28, '10% 1G/10ML', 14, 18, 200.00, 420.00, NULL, 5, 3, 1, '2025-06-12 12:07:58', '2026-02-17 15:17:15'),
(164, 'Chlorure de sodium 10% 1G/10ML', 'Chlorure de sodium', NULL, 28, '10% 1G/10ML', 14, 1, 200.00, 400.00, NULL, 5, NULL, 1, '2025-06-12 12:08:02', '2026-02-17 15:16:49'),
(165, 'Claxin 500MG/10ML Injection IV boîte/50', 'Cloxacilline', NULL, 28, '500MG/10ML', 14, 1, 700.00, 2000.00, NULL, 20, NULL, 1, '2025-06-12 12:13:32', '2026-02-17 15:20:10'),
(168, 'Ceftriaxone1G PDRE Injectable IM//IV B/1 BIOGARAN', 'Ceftriaxone', NULL, 28, '1G', 14, 1, 1000.00, 3000.00, NULL, 20, NULL, 1, '2025-06-12 12:27:42', '2026-02-17 15:19:20'),
(169, 'Kit test rapide d\'electrophrese boîte/20 MEDOMICS', 'kit', NULL, 27, 'autre', 11, 3, 1200.00, 1500.00, NULL, 1, NULL, 1, '2025-06-12 13:07:13', '2025-06-12 13:07:13'),
(170, 'Prolongateur taille/150cm', 'Dispositif', NULL, 40, 'Unité', 18, 1, 1000.00, 2000.00, NULL, 5, NULL, 1, '2025-06-12 13:10:36', '2025-10-25 14:27:49'),
(177, 'Vitamine B complex Injection IM/IV', 'Vitamine B1B6B12', NULL, 28, '2 ml', 14, 1, 100.00, 350.00, NULL, 5, NULL, 1, '2025-06-12 13:52:26', '2026-02-17 14:52:55'),
(178, 'Diclofenac Sodium 75MG/3ML', 'Diclofenac', NULL, 28, '75MG/3ML', 14, 1, 200.00, 1500.00, NULL, 5, NULL, 1, '2025-06-12 13:53:47', '2026-02-17 14:58:26'),
(179, 'Seringue 60 ml embout vissé', 'seringue', NULL, 27, 'ml', 11, 1, 1000.00, 2000.00, NULL, 1, NULL, 1, '2025-06-12 14:33:01', '2025-10-15 12:21:10'),
(180, 'Seringue 60 ml embout en cône', 'seringue', NULL, 27, 'ml', 16, 1, 1000.00, 2000.00, NULL, 1, NULL, 1, '2025-06-12 14:37:06', '2025-10-15 12:20:46'),
(181, 'Sonde urinaire taille/14 FOLEY', 'Sonde', NULL, 37, 'Unité', 18, 1, 700.00, 1500.00, NULL, 5, NULL, 1, '2025-06-12 14:40:20', '2025-10-25 14:05:02'),
(182, 'Gentamycine 80mg/2ml Injection IM/IV', 'Gentamycine', NULL, 28, '80 mg/2ml', 14, 1, 100.00, 350.00, NULL, 5, 7, 1, '2025-06-12 14:41:01', '2026-02-17 14:54:25'),
(183, 'Chlorure de sodium 0,9% flacon/500ml', 'chlorure de sodium', NULL, 28, '500 ml', 13, 1, 500.00, 1000.00, NULL, 30, NULL, 1, '2025-06-12 14:44:33', '2025-10-15 13:11:50'),
(184, 'Gants de soins boîte/100', 'Gant', NULL, 38, 'Paire', 11, 100, 70.00, 10000.00, NULL, 20, NULL, 1, '2025-06-12 14:47:25', '2026-03-03 10:52:14'),
(186, 'Dexamethasone 4MG/ML IV/IM', 'Dexaméthasone', NULL, 28, '4mg/1ml', 14, 1, 50.00, 350.00, NULL, 5, 7, 1, '2025-06-12 14:54:10', '2026-02-17 14:46:57'),
(188, 'Glucose 5% flacon/500ML', 'Glucose', NULL, 28, '500 ml', 15, 1, 500.00, 1000.00, NULL, 30, NULL, 1, '2025-06-12 14:55:04', '2026-03-03 10:16:13'),
(190, 'Speculum medium GRACE', 'Speculum', NULL, 27, 'Unité', 12, 19, 1200.00, 1500.00, NULL, 5, NULL, 1, '2025-06-12 14:57:39', '2025-10-13 15:35:55'),
(194, 'Compresses steriles 40x40cm boîte/10', 'Compresse', NULL, 44, 'Unité', 11, 1, 600.00, 1500.00, NULL, 50, NULL, 1, '2025-06-12 15:08:28', '2026-03-04 09:15:07'),
(195, 'Chlorure de sodium 0,9% flacon/250 ml', 'Sodium', NULL, 27, '250 ml', 19, 1, 500.00, 1000.00, NULL, 30, NULL, 1, '2025-06-12 15:08:52', '2025-10-15 13:12:43'),
(199, 'Glucose 10% Perfusion  500ml', 'Glucose', NULL, 28, '500 ml', 15, 1, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-06-12 15:13:40', '2026-03-03 10:19:51'),
(200, 'Ringer lactate Perfusion flacon 250ML', 'Sodium', NULL, 28, '250 ml', 19, 1, 500.00, 1000.00, NULL, 30, NULL, 1, '2025-06-12 15:18:10', '2025-10-15 13:17:06'),
(201, 'Ringer lactate Perfusion flacon/500ML', 'sodium', NULL, 28, '500 ml', 19, 1, 500.00, 1000.00, NULL, 30, NULL, 1, '2025-06-12 15:19:22', '2026-03-03 07:22:44'),
(202, 'Embout sterile  pour lavage auriculaire', 'DISPOSITIF', NULL, 27, 'unité', 16, 1, 200.00, 1200.00, NULL, 1, NULL, 1, '2025-06-12 15:21:43', '2025-10-10 07:28:52'),
(203, 'Coton absorbant hydrophile', 'Coton', NULL, 27, '1', 17, 1, 200.00, 500.00, NULL, 10, NULL, 1, '2025-06-12 15:25:49', '2025-10-15 12:59:46'),
(204, 'Masque pour nebulisateur', 'Masque', NULL, 38, 'Unité', 15, 1, 200.00, 1200.00, NULL, 1, NULL, 1, '2025-06-12 15:31:15', '2026-03-03 08:16:52'),
(206, 'Masque pour nebulisateur taille/12', 'Masque', NULL, 38, 'Unité', 15, 1, 200.00, 1200.00, NULL, 1, NULL, 1, '2025-06-12 15:32:57', '2026-03-03 08:16:17'),
(207, 'PERCIPRO 200mg/100ml', 'Ciprofloxacine', NULL, 28, '200mg/100ml', 13, 1, 700.00, 2500.00, NULL, 10, NULL, 1, '2025-06-12 15:37:17', '2025-10-15 13:44:51'),
(208, 'Sparadrap perforé 18cmx 5m', 'Sparadrap', NULL, 27, '1', 11, 1, 100.00, 200.00, NULL, 5, NULL, 1, '2025-06-12 15:41:56', '2026-03-11 07:49:40'),
(211, 'zincomax 50mg boîte/60', 'Amoxicilline', NULL, 20, 'plaquette', 11, 1, 2500.00, 4000.00, NULL, 1, NULL, 1, '2025-06-13 07:46:37', '2026-03-03 08:30:57'),
(212, 'Exacul   injectable 0,5g/5ml', 'acide tranexamique', NULL, 28, 'ml', 11, 5, 2500.00, 3000.00, NULL, 1, NULL, 1, '2025-06-13 07:50:39', '2025-10-10 07:33:31'),
(213, 'vitamine B complexe injectable IV/IM', 'Vitamine B1B6B12', NULL, 28, '2 ml', 14, 1, 100.00, 260.00, NULL, 5, 3, 1, '2025-06-13 09:57:40', '2026-02-17 14:52:37'),
(214, 'Furolix 20mg flacon/2ml boîte/10', 'Furosemide', NULL, 28, 'ml', 11, 28, 100.00, 500.00, NULL, 1, NULL, 1, '2025-06-13 10:03:34', '2025-10-10 08:47:36'),
(215, 'Spasfon 40mg/4ml IV/IM', 'phloroglucinol', NULL, 28, '40mg/4ml', 14, 1, 200.00, 2000.00, NULL, 5, NULL, 1, '2025-06-13 10:11:26', '2026-02-17 15:09:01'),
(216, 'Vogalene injection 10mg/1ml', 'Métopimazine', NULL, 28, '10 mg/ml', 14, 1, 100.00, 1500.00, NULL, 5, NULL, 1, '2025-06-13 10:15:17', '2026-02-17 15:05:47'),
(217, 'Vogalene injection 10mg/1ml', 'Métopimazine', NULL, 28, '10mg/1ml', 14, 1, 100.00, 420.00, NULL, 1, 5, 1, '2025-06-13 10:16:46', '2026-02-17 15:06:16'),
(218, 'Smecta goût fraise boîte/12', 'Diosmectite', NULL, 27, 'sachet', 11, 3, 100.00, 500.00, NULL, 5, NULL, 1, '2025-06-13 10:23:33', '2025-10-13 15:08:10'),
(221, 'Avuclamox 1,2g+eau PPI flacon/10ml boîte/1 IV/IM', 'amoxicilline+potassium clavulanate', NULL, 28, '1000mg/200mg', 14, 1, 1000.00, 4000.00, NULL, 20, NULL, 1, '2025-06-13 10:33:30', '2026-03-06 08:09:10'),
(224, 'Soluté mixte glucose 5%+chlorure de sodium 0,9% flacon/500ml', 'Glucose+ Nacl', NULL, 28, '500 ml', 15, 1, 500.00, 1200.00, NULL, 30, NULL, 1, '2025-06-13 10:58:14', '2026-03-03 10:24:14'),
(226, 'Granion kit bio sommeil', 'Vitamine', NULL, 25, 'ml', 13, 1, 1500.00, 2500.00, NULL, 1, NULL, 1, '2025-06-13 11:17:33', '2026-03-03 10:34:32'),
(227, 'Sparadrap Hyppoallergénique  18cmx 30cm', 'Sparadrap', NULL, 27, 'autre', 11, 4, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-06-13 11:21:07', '2025-10-15 12:35:16'),
(228, 'Cipromed 500MG boîte/10x10', 'Ciprofloxacine', NULL, 20, 'comprime', 11, 1, 1500.00, 2000.00, NULL, 1, NULL, 1, '2025-06-13 11:42:01', '2026-03-04 09:22:15'),
(232, 'Ketaglo boîte/10 comprimé GLOBELA', 'ketoconazole', NULL, 20, 'plaquette', 11, 10, 1500.00, 2000.00, NULL, 1, NULL, 1, '2025-06-13 11:56:08', '2025-10-07 14:58:34'),
(233, 'Monatrim suspension buvable flacon/100ml(cotrimoxazol) ZEE', 'Cotrimoxazol', NULL, 25, 'Ml', 11, 3, 850.00, 1200.00, NULL, 1, NULL, 1, '2025-06-13 12:03:50', '2025-10-10 10:46:14'),
(234, 'Azimed 500mg comprimé boîte/3 MEDNEXT', 'Azithromycine', NULL, 20, '500mg', 11, 3, 2500.00, 4000.00, NULL, 1, NULL, 1, '2025-06-13 12:07:27', '2026-02-17 09:11:27'),
(235, 'lumatrime 80/480 comprimé boîte/6 PHARMEDA', 'Artemether +luméfantrime', NULL, 20, 'plaquette', 11, 18, 2500.00, 4000.00, NULL, 1, NULL, 1, '2025-06-13 12:10:15', '2025-10-07 15:59:32'),
(236, 'Amidou (amikacin) 500mg  IV/IM flacon/2ml', 'amikacin', NULL, 28, '500 MG/2ML', 14, 1, 3200.00, 4000.00, NULL, 5, NULL, 1, '2025-06-13 12:14:17', '2026-02-17 08:43:43'),
(237, 'Omprasec injection 40mg IV', 'Omeprazol', NULL, 28, 'Ml', 13, 2, 500.00, 2000.00, NULL, 1, NULL, 1, '2025-06-13 12:20:31', '2025-10-10 11:49:30'),
(238, 'Mag2 injectable 0,8% (magnesium) boîte/12 flacon/10ml', 'Magnesium', NULL, 28, 'Ml', 11, 2, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-06-13 13:50:55', '2025-10-13 11:17:10'),
(239, 'pot à urine', 'Pot', NULL, 27, 'Ml', 17, 2, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-06-13 13:54:42', '2025-10-13 12:08:54'),
(240, 'Benzathine benzylpenicillin 2,4MUI flacon/50 IM REYOUNG', 'Benzathine benzylpenicillin', NULL, 28, '2,4MUI', 14, 1, 1100.00, 3000.00, NULL, 1, NULL, 1, '2025-06-13 14:10:29', '2026-02-17 09:19:18'),
(241, 'Poche à urine pediatrique 100ml boîte/100 GRACE', 'Poche', NULL, 27, 'unité', 19, 1, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-06-13 14:13:43', '2025-10-13 12:05:14'),
(245, 'Aiguille à portion lombaire orange 25G', 'Aiguille', NULL, 27, '1', 28, 1, 5000.00, 7000.00, NULL, 5, NULL, 1, '2025-06-13 14:26:47', '2026-02-17 08:38:04'),
(246, 'Aiguille à portion lombaire violet 24G', 'Aiguille', NULL, 27, '1', 28, 1, 5000.00, 7000.00, NULL, 5, NULL, 1, '2025-06-13 14:28:13', '2026-02-17 08:38:28'),
(247, 'Ecouvillon GRACE', 'soin', NULL, 24, 'unité', 21, 254, 50.00, 100.00, NULL, 1, NULL, 1, '2025-06-13 14:30:24', '2025-06-13 15:34:34'),
(248, 'Extracteur de mucus enfant MEDIKIT', 'soin', NULL, 24, 'unité', 21, 6, 1500.00, 2000.00, NULL, 1, NULL, 1, '2025-06-13 14:36:30', '2025-06-13 14:36:30'),
(250, 'Test rapide hepatite B HBsAg+cassette WONDFO', 'prélèvement', NULL, 24, 'unité', 21, 18, 400.00, 1000.00, NULL, 1, NULL, 1, '2025-06-13 15:01:11', '2025-06-13 15:01:11'),
(251, 'Test rapide hepatite C HcV+cassette WONDFO', 'prélèvement', NULL, 24, 'unité', 21, 18, 400.00, 1000.00, NULL, 1, NULL, 1, '2025-06-13 15:03:50', '2025-06-13 15:03:50'),
(252, 'Test rapide VIH bandelettes+cassettes boîte/40', 'prélèvement', NULL, 24, 'unité', 21, 64, 400.00, 1000.00, NULL, 1, NULL, 1, '2025-06-13 15:11:28', '2025-06-13 15:11:28'),
(253, 'test rapide siphilis AB casette+reactif', 'prélèvement', NULL, 24, 'unité', 21, 30, 400.00, 1000.00, NULL, 1, NULL, 1, '2025-06-13 15:14:04', '2025-06-13 15:14:04'),
(254, 'tube sec 5ml (rouge) CATHERINE', 'prélèvement', NULL, 28, 'unité', 21, 74, 400.00, 1000.00, NULL, 1, NULL, 1, '2025-06-13 15:25:24', '2025-06-13 15:25:24'),
(255, 'Tube EDTA.K3  05ml GRACE', 'prélèvement', NULL, 24, 'unité', 22, 1, 400.00, 1000.00, NULL, 1, NULL, 1, '2025-06-13 15:28:10', '2025-06-13 15:28:10'),
(256, 'Tube EDTA.K3  4ml  ERSIN', 'prélèvement', NULL, 24, 'unité', 23, 136, 400.00, 1000.00, NULL, 1, NULL, 1, '2025-06-13 15:29:59', '2025-06-13 15:29:59'),
(257, 'Ecouvillon sterile  GRACE', 'soin', NULL, 24, 'unité', 21, 14, 500.00, 1200.00, NULL, 1, NULL, 1, '2025-06-13 15:32:55', '2025-06-13 15:32:55'),
(259, 'Test rapide quantitatif LH+cassette WONDFO', 'prélèvement', NULL, 24, 'unité', 21, 23, 3500.00, 5000.00, NULL, 1, NULL, 1, '2025-06-13 15:42:03', '2025-06-13 15:42:03'),
(260, 'Test rapide quantitatif FSH+cassette WONDFO', 'prélèvement', NULL, 24, 'unité', 21, 23, 3500.00, 5000.00, NULL, 1, NULL, 1, '2025-06-13 15:44:16', '2025-06-13 15:44:16'),
(261, 'Test Invitro thromboplastin cassettes WONDFO', 'prélèvement', NULL, 24, 'unité', 21, 6, 2000.00, 5000.00, NULL, 1, NULL, 1, '2025-06-13 15:48:19', '2025-06-13 15:48:19'),
(262, 'Test Invitro prothrombin cassettes WONDFO', 'prélèvement', NULL, 24, 'unité', 21, 21, 2000.00, 5000.00, NULL, 1, NULL, 1, '2025-06-13 15:50:27', '2025-06-13 15:50:27'),
(263, 'Paracetamol 500mg boîte/10x10', 'paracetamol', NULL, 20, '500mg', 15, 10, 100.00, 250.00, NULL, 10, NULL, 1, '2025-06-14 07:40:23', '2025-10-15 13:59:15'),
(264, 'Rocuronium SP 10mg/ml(2°c-8°c) flacon/5ml IV', 'Rocuronium', NULL, 28, '10 mg/ml', 13, 10, 3320.00, 10000.00, NULL, 3, NULL, 1, '2025-06-14 07:46:53', '2025-10-25 13:17:26'),
(265, 'Adrenaline HCL injection 1ml/1ml IV/IM', 'adrenaline', NULL, 28, '1 ml', 13, 1, 1000.00, 3000.00, NULL, 3, NULL, 1, '2025-06-14 07:57:50', '2025-10-25 14:02:06'),
(266, 'Fentanyl 50mg/ml IV/IM', 'Fentanyl', NULL, 28, '50 mg/ml', 11, 1, 2500.00, 8000.00, NULL, 5, NULL, 1, '2025-06-14 08:04:33', '2025-10-23 14:19:02'),
(267, 'Trabar-100mg injection flacon/2ml IV/IM/SC', 'Tramadol', NULL, 28, 'Ml', 11, 3, 1000.00, 2000.00, NULL, 5, NULL, 1, '2025-06-14 08:10:51', '2025-10-13 15:57:17'),
(268, 'Morphine sulfate 10mg/1ml IV/IM/SC', 'Morphine', NULL, 28, '10mg', 11, 3, 1000.00, 5000.00, NULL, 1, NULL, 1, '2025-06-14 08:16:05', '2025-10-31 14:07:48'),
(271, 'Trandate 200mg boîte/10', 'trandate', NULL, 20, 'comprimé', 11, 10, 1500.00, 2000.00, NULL, 1, NULL, 1, '2025-06-14 08:37:15', '2025-06-14 08:37:15'),
(272, 'Loxen LP 50mg', 'Nicardipine', NULL, 21, 'gélule', 16, 10, 500.00, 1500.00, NULL, 5, NULL, 1, '2025-06-14 08:41:18', '2025-10-16 15:10:22'),
(273, 'Marcaïne spinal 0,5% (5mg/1ml) HYPERBARE', 'Bupivacaïne', NULL, 28, '5mg/1ml', 11, 2, 4000.00, 8000.00, NULL, 5, NULL, 1, '2025-06-14 08:46:47', '2026-03-03 09:49:45'),
(275, 'Pabal RTS 100mg/ml IV/IM', 'carbetocin', NULL, 28, 'ml', 11, 5, 1200.00, 1500.00, NULL, 1, NULL, 1, '2025-06-14 08:58:20', '2025-06-14 08:58:20'),
(276, 'Naropin 10mg/ml boîte/5 flacon/20ml IV', 'Ropivacaïne hydrochloride', NULL, 28, '10 mg', 13, 1, 5000.00, 8000.00, NULL, 5, NULL, 1, '2025-06-14 09:06:37', '2025-11-03 14:43:05'),
(277, 'Naropin7,5mg/ml boîte/5 flacon/20ml IV', 'Ropivacaïne hydrochloride', NULL, 28, '7,5mg', 13, 1, 5000.00, 8000.00, NULL, 5, NULL, 1, '2025-06-14 09:07:41', '2025-11-03 14:44:07'),
(279, 'Medazolan via1mg/ml(5mg/5ml) IV/IM/SC/VR', 'Medazolam', NULL, 28, 'Ml', 13, 3, 1200.00, 1500.00, NULL, 1, NULL, 1, '2025-06-14 09:18:55', '2025-10-10 10:18:44'),
(280, 'Ketamine 500MG/10ML IV/IM', 'Ketamine', NULL, 28, '500MG/10ML', 11, 1, 1200.00, 8000.00, NULL, 2, NULL, 1, '2025-06-14 09:22:00', '2025-10-23 14:34:22'),
(396, 'Metronidazole 500mg/100ml', 'Metronidazole', '1', 28, '500mg/100ml', 13, 1, 1000.00, 3000.00, NULL, 30, NULL, 1, '2025-09-01 09:50:53', '2026-03-03 08:29:19'),
(397, 'Diclofenac suppositoires 100mg bt/10', 'Diclofenac', NULL, 29, '100 MG', 29, 1, 150.00, 350.00, NULL, 5, NULL, 1, '2025-09-01 10:17:33', '2026-02-17 15:02:54'),
(398, 'Tiorfan nourrisson 10mg bt/16 sachets', 'Racécadotril', NULL, 27, '10mg', 11, 1, 1500.00, 3850.00, NULL, 1, NULL, 1, '2025-09-01 13:36:05', '2026-03-17 09:17:24'),
(400, 'Cefotaxime 1g IV/IM', 'cefotaxime sodique', NULL, 28, 'ml', 14, 1, 1500.00, 5000.00, NULL, 1, NULL, 1, '2025-09-04 10:51:15', '2026-03-04 09:32:19'),
(401, 'Acupan 20mg/ 2ml bte/5 IV/IM', 'néfopam', NULL, 28, 'ml', 14, 1, 500.00, 2000.00, NULL, 5, NULL, 1, '2025-09-04 10:55:35', '2025-10-10 13:17:23'),
(403, 'Artesun 60  IM/IV', 'Artesunate', NULL, 28, '60 mg', 13, 1, 500.00, 2800.00, NULL, 6, NULL, 1, '2025-09-04 11:30:49', '2026-02-17 08:58:06'),
(407, 'Sonde d\'aspiration avec embout male', 'Gyneas', NULL, 27, 'Unité', 19, 1, 500.00, 1000.00, NULL, 5, NULL, 1, '2025-09-04 12:21:54', '2025-10-13 15:23:58'),
(408, 'Catheter ombilical 4FR', NULL, NULL, 27, 'unité', 16, 1, 20000.00, 30000.00, NULL, 1, NULL, 1, '2025-09-04 12:33:11', '2025-10-15 12:48:46'),
(409, 'Catheter ombilical 3.5FR', NULL, NULL, 27, 'unité', 16, 1, 20000.00, 30000.00, NULL, 1, NULL, 1, '2025-09-04 12:38:42', '2025-10-15 12:47:40'),
(410, 'Catheter ombilical 5FR', 'catheter', NULL, 27, '1', 16, 1, 20000.00, 30000.00, NULL, 1, NULL, 1, '2025-09-04 12:41:39', '2025-10-15 12:48:12'),
(411, 'Vicryl 2 aiguille ronde', 'fil', NULL, 27, 'unité', 11, 1, 2500.00, 4000.00, NULL, 5, NULL, 1, '2025-09-04 12:58:25', '2025-10-25 14:20:49'),
(412, 'Vicryl 3 aiguille ronde', 'fil', NULL, 27, 'unité', 11, 1, 2500.00, 4000.00, NULL, 5, NULL, 1, '2025-09-04 13:01:27', '2025-10-25 14:22:17'),
(413, 'Novosyn 1 rond', 'Fil', NULL, 24, 'Ml', 21, 1, 2000.00, 5000.00, NULL, 1, NULL, 1, '2025-09-04 13:06:34', '2025-10-10 11:46:54'),
(414, 'Vicryl 0 aiguille triangulaire', 'fil', NULL, 27, 'unité', 11, 1, 2500.00, 4000.00, NULL, 5, NULL, 1, '2025-09-04 13:08:52', '2025-10-25 14:17:23'),
(415, 'Vicryl 1 aiguille triangulaire', 'fil', NULL, 27, 'unité', 11, 1, 2500.00, 4000.00, NULL, 5, NULL, 1, '2025-09-04 13:10:40', '2025-10-25 14:19:19'),
(416, 'Vicryl 2/0 Rapide aiguille triangulaire', 'fil', NULL, 27, 'unité', 11, 1, 2500.00, 4000.00, NULL, 5, NULL, 1, '2025-09-04 13:13:39', '2025-10-25 14:21:41'),
(417, 'Vicryl 0 aiguille ronde', 'fil', NULL, 32, 'unité', 11, 1, 2500.00, 4000.00, NULL, 5, NULL, 1, '2025-09-04 13:19:20', '2025-10-25 14:16:17'),
(418, 'Vicryl 1 aiguille ronde', 'fil', NULL, 27, 'unité', 11, 1, 2500.00, 4000.00, NULL, 5, NULL, 1, '2025-09-04 13:20:54', '2025-10-25 14:18:18'),
(419, 'Novosyn 0 rond', 'Fil', NULL, 24, 'Unité', 21, 1, 2000.00, 5000.00, NULL, 1, NULL, 1, '2025-09-04 13:23:46', '2025-10-10 11:43:10'),
(420, 'Ethilon 2/0 triangle', 'fil', NULL, 24, 'unité', 21, 1, 2000.00, 5000.00, NULL, 1, NULL, 1, '2025-09-04 13:28:24', '2025-10-10 07:31:46'),
(423, 'Efferalgan pédiatrique fl/90ml', 'paracétamol', NULL, 25, 'ml', 13, 1, 1570.00, 3500.00, NULL, 1, NULL, 1, '2025-09-16 10:49:37', '2025-10-09 13:22:31'),
(424, 'doliprane 1000 effervesant', 'paracétamol', NULL, 20, 'Comprimé', 11, 1, 1326.00, 2500.00, NULL, 1, NULL, 1, '2025-09-16 10:55:28', '2025-09-16 10:55:28'),
(425, 'Pinkoo grippe water fl/120ml', 'gripe water', NULL, 25, 'ml', 13, 1, 2990.00, 4000.00, NULL, 1, NULL, 1, '2025-09-16 11:01:47', '2025-10-08 11:19:47'),
(426, 'serum physiodose bte/15 fl/5ml', 'aérosol', NULL, 24, 'ml', 21, 1, 1790.00, 3000.00, NULL, 1, NULL, 1, '2025-09-16 11:07:25', '2025-09-16 11:07:25'),
(427, 'Muscoter 150l fl/30ml', 'Ciclopirox olamine', NULL, 30, 'Ml', 12, 1, 3480.00, 5000.00, NULL, 1, NULL, 1, '2025-09-16 11:10:44', '2025-10-10 11:32:43'),
(428, 'Eludril pro solution BB fl/90ml', 'Digluconate de chlorhexidine', NULL, 42, 'ml', 13, 1, 1540.00, 2500.00, NULL, 1, NULL, 1, '2025-09-16 11:17:49', '2026-03-04 08:50:55'),
(429, 'Cac 1000 orange', 'comprimé effervessant', NULL, 22, 'Comprimé', 11, 10, 1980.00, 3000.00, NULL, 1, NULL, 1, '2025-09-16 11:23:11', '2026-02-17 09:21:04'),
(430, 'Maloox bte/20', 'antiacide', NULL, 44, 'ml', 11, 1, 3325.00, 4000.00, NULL, 1, NULL, 1, '2025-09-16 11:38:35', '2026-03-03 09:58:14'),
(431, 'Allergine 10mg bte/15', 'allergine', NULL, 20, '10 mg', 11, 15, 3680.00, 5000.00, NULL, 1, NULL, 1, '2025-09-16 11:58:17', '2026-02-17 08:42:13'),
(433, 'Tramadis 100ml/2ml bte/5', 'Tramadol', NULL, 28, 'Ml', 11, 1, 250.00, 1000.00, NULL, 5, NULL, 1, '2025-09-17 08:22:57', '2026-03-06 07:56:28'),
(434, 'Norop 2ml/mlsulfente 0,2ml', 'Norop', NULL, 28, 'Ml', 14, 1, 5000.00, 2500.00, NULL, 1, NULL, 1, '2025-09-17 08:27:47', '2025-10-10 11:38:56'),
(435, 'Naloxone hydrochloride 400 ug/ml', 'Naloxone', NULL, 28, '400ug/ml', 14, 1, 4500.00, 10000.00, NULL, 5, NULL, 1, '2025-09-17 08:31:25', '2026-03-03 08:40:26'),
(436, 'prostigmine 0,5mg/1ml', 'prostigmine', NULL, 28, '0,5mg/1ml', 14, 1, 5000.00, 10000.00, NULL, 3, NULL, 1, '2025-09-17 08:35:38', '2025-10-23 14:58:40'),
(437, 'Enantone LP 3,75mg', 'leuproreline', NULL, 28, 'ml', 14, 1, 5000.00, 1500.00, NULL, 1, NULL, 1, '2025-09-17 08:43:09', '2025-09-17 08:43:09'),
(438, 'Cisatracurium accord 2mg/ml 10ml/5ml bte/5', 'cisatracurium', NULL, 28, 'ml', 13, 1, 5000.00, 200.00, NULL, 1, NULL, 0, '2025-09-17 08:48:42', '2025-10-25 13:15:28'),
(439, 'Sulfate de magnesium 50% P/V', 'Sulfate', NULL, 28, 'Ml', 13, 1, 4000.00, 1000.00, NULL, 5, NULL, 1, '2025-09-17 08:52:20', '2025-10-13 11:18:51'),
(440, 'Orgalutran0,25mg /0,5ml bte/5', 'Orgalutran', NULL, 28, 'Ml', 13, 1, 6000.00, 1500.00, NULL, 1, NULL, 1, '2025-09-17 08:57:22', '2025-10-10 12:04:01'),
(441, 'RECURONIUM HIKMA 10MG/ML BTE/10', 'recuronium', NULL, 28, 'ml', 13, 1, 7000.00, 2000.00, NULL, 1, NULL, 1, '2025-09-17 09:04:52', '2025-09-17 09:04:52'),
(442, 'Progesterone retart 500mg bte/3 IM', 'progesterone', NULL, 28, 'ml', 14, 1, 15000.00, 5000.00, NULL, 1, NULL, 1, '2025-09-17 09:09:50', '2026-03-03 07:29:57'),
(443, 'SYNERGON IM', 'progesterone-estrone', NULL, 28, 'ml', 14, 1, 8000.00, 2000.00, NULL, 1, NULL, 1, '2025-09-17 09:16:17', '2025-09-17 09:16:17'),
(445, 'Artesun 120 IM/IV', 'artesunate', NULL, 28, '120 mg', 13, 1, 0.00, 4000.00, NULL, 6, NULL, 1, '2025-10-07 11:04:28', '2026-02-17 08:57:38'),
(446, 'Eau oxygenée 250ml GILBERT', 'Peroxyde d\'hydrogène', NULL, 42, '250 Ml', 13, 1, 0.00, 2500.00, NULL, 0, NULL, 1, '2025-10-13 09:05:22', '2026-02-17 15:15:19'),
(447, 'Eau oxygénée 125ml GILBERT', 'Peroxyde d\'hydrogène', NULL, 42, '125 Ml', 13, 1, 0.00, 2500.00, NULL, 0, NULL, 1, '2025-10-13 09:08:27', '2026-02-17 15:14:52'),
(448, 'Lovenox 12000 UI', 'Enoxaparine', NULL, 28, '12000 UI', 20, 1, 1500.00, 4500.00, NULL, 1, NULL, 1, '2025-10-13 09:16:29', '2025-10-15 14:30:44'),
(449, 'Lovenox 6000 UI', 'Enoxaparine', NULL, 28, '6000 UI', 20, 1, 1500.00, 4500.00, NULL, 1, NULL, 1, '2025-10-13 09:18:24', '2025-10-15 14:32:02'),
(452, 'Gardenal 40mg/2ml', 'Phénobarbital', NULL, 28, '40mg/2ml', 13, 1, 0.00, 5000.00, NULL, 2, NULL, 1, '2025-10-13 09:26:37', '2025-10-15 14:17:27'),
(453, 'El-fudic', 'Acide fucidique', NULL, 30, '15g', 12, 1, 2300.00, 3000.00, NULL, 1, NULL, 1, '2025-10-13 09:29:55', '2026-02-17 15:34:22'),
(454, 'Amlodipine 10mg bte/30', 'Amlodipine', NULL, 20, '10mg', 15, 10, 2000.00, 5000.00, NULL, 1, NULL, 1, '2025-10-14 09:29:25', '2026-02-17 08:48:14'),
(455, 'Oxygene forfait journalier', 'O2', NULL, 27, '1', 16, 1, 0.00, 20000.00, NULL, 5, NULL, 1, '2025-10-15 12:01:52', '2025-10-21 13:06:52'),
(456, 'Ceftriaxone1G PDRE Injectable IM//IV B/1 BIOGARAN', 'Ceftriaxone', NULL, 28, '1G', 14, 1, 1000.00, 4000.00, NULL, 20, 3, 1, '2025-10-15 14:25:44', '2026-03-06 08:06:41'),
(457, 'Salbudis 0,5MG/ML Injection SC/IM', 'Salbutamol', NULL, 28, '0,5mg/1ml', 14, 1, 0.00, 0.00, NULL, 5, NULL, 1, '2025-10-15 14:47:20', '2026-02-17 14:44:15'),
(458, 'Calcium gluconate injection 1g/10ml(IV)', 'calcium', NULL, 28, '1G', 14, 1, 100.00, 360.00, NULL, 10, 3, 1, '2025-10-15 14:59:05', '2025-10-15 14:59:05'),
(459, 'Gentamycine 80mg/2ml Injection IM/IV', 'Gentamycine', NULL, 28, '80mg/2ml', 14, 1, 100.00, 1000.00, NULL, 5, 3, 1, '2025-10-16 09:54:33', '2026-02-17 14:53:54'),
(460, 'Artemether 80MG/1ML Injection', 'Artemether', NULL, 28, '80MG/1ML', 14, 1, 200.00, 1500.00, NULL, 6, NULL, 1, '2025-10-16 14:59:47', '2026-02-17 15:04:53'),
(461, 'Chlorure de potassium 10% Injection 1G/10ML', 'potassium', NULL, 28, '10% 1G/10ML', 14, 1, 200.00, 360.00, NULL, 5, 3, 1, '2025-10-16 15:26:59', '2026-02-17 15:15:50'),
(462, 'Geloplasma 4% 500ml', 'Gelofusime', NULL, 28, '500 ml', 15, 1, 5000.00, 10000.00, NULL, 2, NULL, 1, '2025-10-23 13:56:12', '2026-03-03 10:41:32'),
(463, 'propofol', 'diprivan', NULL, 28, '20ml', 14, 1, 5000.00, 9000.00, NULL, 5, NULL, 1, '2025-10-23 14:41:21', '2025-10-23 14:41:21'),
(464, 'Misoprostol', 'Misoprostol', NULL, 20, '200 mcg', 11, 4, 1000.00, 1500.00, NULL, 5, NULL, 1, '2025-10-25 14:00:42', '2026-03-03 08:26:53'),
(465, 'Champs abdominaux', 'champ abdominal', NULL, 36, 'Unité', 18, 5, 1500.00, 4000.00, NULL, 10, NULL, 1, '2025-10-25 14:04:02', '2025-10-25 14:04:02'),
(466, 'Lame de bistouri N°23', 'Lame de bistouri', NULL, 32, 'Unité', 16, 1, 200.00, 500.00, NULL, 10, NULL, 1, '2025-10-25 14:07:44', '2025-10-25 14:07:44'),
(467, 'Masque laryngé', 'Masque', NULL, 38, 'Unité', 15, 1, 3000.00, 5000.00, NULL, 3, NULL, 1, '2025-10-25 14:26:43', '2026-03-03 08:15:32'),
(469, 'sevoflurane forfait 2H de bloc opératoire', 'sevoflurane gaz halogéné', NULL, 24, 'unité', 21, 1, 2000.00, 10000.00, NULL, 1, NULL, 1, '2025-10-31 13:20:27', '2025-10-31 13:20:27'),
(470, 'sonde endotrachéale', NULL, NULL, 27, 'unité', 16, 1, 3000.00, 5000.00, NULL, 1, NULL, 1, '2025-10-31 13:43:12', '2025-10-31 13:43:12'),
(471, 'Trousse d\'irrigation SSI', 'trousse d\'irrigation SSI', NULL, 40, 'unité', 16, 1, 15000.00, 20000.00, NULL, 1, NULL, 1, '2025-11-03 12:59:00', '2025-11-03 12:59:00'),
(472, 'Chlorure de sodium 0,9% flacon/3000ml', 'serum salé istonique 3000 l', NULL, 38, '3000 l', 19, 1, 3000.00, 6500.00, NULL, 4, NULL, 1, '2025-11-03 13:01:01', '2025-11-03 13:01:01'),
(473, 'Surblouse chirurgicale', 'surblouse chirurgicale', NULL, 27, 'unité', 16, 1, 1850.00, 3000.00, NULL, 10, NULL, 1, '2025-11-03 13:07:41', '2025-11-03 13:07:41'),
(474, 'Electrodes ECG/kit de 3', 'électrodes ECG', NULL, 27, 'unité', 16, 1, 500.00, 1500.00, NULL, 15, NULL, 1, '2025-11-03 13:23:26', '2025-11-03 13:23:54'),
(476, 'Klipal 600/50 mg', NULL, NULL, 20, 'unité', 16, 1, 700.00, 1000.00, NULL, 5, NULL, 1, '2025-11-03 13:34:54', '2025-11-03 13:34:54'),
(478, 'Champ stérile', 'champ sterile', NULL, 27, 'unité', 16, 1, 3000.00, 5000.00, NULL, 1, NULL, 1, '2025-11-03 14:39:55', '2025-11-03 14:39:55'),
(479, 'Kit Pose APD', NULL, NULL, 27, 'unité', 16, 1, 12500.00, 20000.00, NULL, 3, NULL, 1, '2025-11-03 14:40:44', '2025-11-03 14:52:12'),
(481, 'Naropin 2mg/ml boîte/5 flacon/20ml IV', 'Ropivacaïne hydrochloride', NULL, 28, '2mg', 13, 1, 5000.00, 8000.00, NULL, 5, NULL, 1, '2025-11-03 14:45:01', '2025-11-03 14:45:01'),
(483, 'Levmentin 1G/200MG', 'Amoxicilline+potassium clavulanate', NULL, 28, '1G/200MG', 13, 1, 0.00, 4000.00, NULL, 10, NULL, 1, '2026-02-17 09:10:31', '2026-03-03 10:10:09'),
(484, 'Vogalene injection 10mg/1ml', 'Métopimazine', NULL, 28, '10mg/1ml', 14, 1, 0.00, 400.00, NULL, 1, 3, 1, '2026-02-17 15:07:48', '2026-02-17 15:07:48'),
(485, 'Catheter 24G jaune', NULL, NULL, 27, '1', 16, 1, 100.00, 350.00, NULL, 10, 7, 1, '2026-02-17 15:39:19', '2026-02-17 15:39:19'),
(486, 'Catheter 22G Bleu', NULL, NULL, 27, '1', 16, 1, 100.00, 350.00, NULL, 10, 7, 1, '2026-02-17 15:40:12', '2026-02-17 15:40:12'),
(487, 'Catheter 20G Rose', NULL, NULL, 27, '1', 16, 1, 100.00, 350.00, NULL, 10, 7, 1, '2026-02-17 15:40:58', '2026-02-17 15:40:58'),
(488, 'Catheter 18G Vert', NULL, NULL, 27, '1', 16, 1, 100.00, 350.00, NULL, 10, 7, 1, '2026-02-17 15:45:08', '2026-02-17 15:45:08'),
(489, 'Catheter 16G Gris', NULL, NULL, 27, '1', 16, 1, 100.00, 350.00, NULL, 10, NULL, 1, '2026-02-17 15:46:00', '2026-02-17 15:46:00'),
(490, 'Glucose 10% Perfusion  250ml', 'Glucose', NULL, 28, 'ml', 15, 1, 400.00, 1000.00, NULL, 10, NULL, 1, '2026-03-03 10:22:47', '2026-03-03 10:22:47'),
(491, 'Epicrânien 22G(Vert)', 'Epicranien', NULL, 45, 'unite', 11, 1, 50.00, 250.00, NULL, 20, NULL, 1, '2026-03-04 08:37:01', '2026-03-04 08:38:05'),
(492, 'Alben', 'Albendazole', NULL, 25, 'ml', 13, 1, 0.00, 0.00, NULL, 2, NULL, 1, '2026-03-10 11:21:24', '2026-03-10 11:21:24'),
(493, 'Alben 400mg', 'Albendazole', NULL, 20, 'comprime', 11, 1, 0.00, 0.00, NULL, 2, NULL, 1, '2026-03-10 11:25:17', '2026-03-10 11:25:17'),
(494, 'Neurone 2ml', 'Vit B complex', NULL, 28, 'ml', 14, 1, 500.00, 1000.00, NULL, 10, NULL, 1, '2026-03-12 08:27:47', '2026-03-17 08:50:13'),
(495, 'Ampicillin sodium injection 0,5g IM/IV', 'Ampicilline', NULL, 28, '0,5G', 14, 1, 800.00, 2500.00, NULL, 5, NULL, 1, '2026-04-15 10:33:46', '2026-04-15 10:34:56');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `conditionnements`
--
ALTER TABLE `conditionnements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `conditionnements_libelle_unique` (`libelle`);

--
-- Index pour la table `formes_galeniques`
--
ALTER TABLE `formes_galeniques`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `forme_galeniques_libelle_unique` (`libelle`);

--
-- Index pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `fournisseurs_raison_sociale_unique` (`raison_sociale`);

--
-- Index pour la table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `produits_code_cip_unique` (`code_cip`),
  ADD KEY `produits_nom_index` (`nom`),
  ADD KEY `produits_principe_actif_index` (`principe_actif`),
  ADD KEY `produits_forme_galenique_id_fk` (`forme_galenique_id`),
  ADD KEY `produits_conditionnement_id_fk` (`conditionnement_id`),
  ADD KEY `produits_assureur_id_foreign` (`assureur_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `conditionnements`
--
ALTER TABLE `conditionnements`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT pour la table `formes_galeniques`
--
ALTER TABLE `formes_galeniques`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `produits`
--
ALTER TABLE `produits`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=496;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `produits`
--
ALTER TABLE `produits`
  ADD CONSTRAINT `produits_assureur_id_foreign` FOREIGN KEY (`assureur_id`) REFERENCES `assurances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `produits_conditionnement_id_fk` FOREIGN KEY (`conditionnement_id`) REFERENCES `conditionnements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `produits_forme_galenique_id_fk` FOREIGN KEY (`forme_galenique_id`) REFERENCES `formes_galeniques` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
