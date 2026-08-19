-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : lun. 04 mai 2026 à 09:05
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
-- Structure de la table `magasins`
--

CREATE TABLE `magasins` (
  `id` bigint UNSIGNED NOT NULL,
  `nom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `emplacement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `magasins`
--

INSERT INTO `magasins` (`id`, `nom`, `emplacement`, `description`, `actif`, `created_at`, `updated_at`) VALUES
(1, 'Magasin central', 'Bâtiment principal', 'Stock central', 1, '2025-08-12 20:51:23', '2025-08-12 20:51:23'),
(2, 'Magasin Plénitude', 'Bâtiment Plénitude, 2e étage', 'Magasin Plénitude (2e étage)', 1, '2025-08-12 20:51:23', '2025-08-12 20:51:23'),
(3, 'Pharmacie du jour', 'Officine — RDC', 'Pharmacie de jour', 1, '2025-08-12 20:51:23', '2025-08-12 20:51:23'),
(4, 'Pharmacie de nuit', 'Officine — RDC', 'Pharmacie de nuit', 1, '2025-08-12 20:51:23', '2025-08-12 20:51:23');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `magasins`
--
ALTER TABLE `magasins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `magasins_nom_unique` (`nom`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `magasins`
--
ALTER TABLE `magasins`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
