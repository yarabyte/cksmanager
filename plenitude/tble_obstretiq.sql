-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2.1
-- http://www.phpmyadmin.net
--
-- Client :  localhost
-- Généré le :  Dim 26 Juillet 2026 à 07:29
-- Version du serveur :  5.7.30-0ubuntu0.16.04.1
-- Version de PHP :  7.0.33-0ubuntu0.16.04.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `plenitude`
--

-- --------------------------------------------------------

--
-- Structure de la table `tble_obstretiq`
--

CREATE TABLE `tble_obstretiq` (
  `IDObstetriq` int(11) NOT NULL,
  `IDAntecedant` int(11) NOT NULL,
  `DateObs` varchar(10) NOT NULL,
  `Procreateur` int(10) NOT NULL,
  `Terme` varchar(50) NOT NULL,
  `PathGross` varchar(50) NOT NULL,
  `Accou` varchar(50) NOT NULL,
  `Enfant` varchar(50) NOT NULL,
  `Lieu` varchar(50) NOT NULL,
  `PostPartum` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `tble_obstretiq`
--

INSERT INTO `tble_obstretiq` (`IDObstetriq`, `IDAntecedant`, `DateObs`, `Procreateur`, `Terme`, `PathGross`, `Accou`, `Enfant`, `Lieu`, `PostPartum`) VALUES
(3, 3, '01/05/2017', 1, '40', 'diabete gestationnel', 'vbs forceps', 'fille rculaire serre4500g apgar 10/10 ci', 'cks', 'hematome de paroi'),
(4, 3, '01/06/2014', 2, '12', 'cystite aigue', 'expulsion spontanee', 'fcs', 'cks', 'simples'),
(5, 4, '28/09/2017', 1, '9', 'aucune', 'oui', '1', 'Douala', '2'),
(6, 5, '03/08/2018', 1, '5', 'ras', 'oui', '1', 'CKS', '8'),
(7, 5, '14/10/2018', 2, '9', 'a terme ras', 'oui', '1', 'cks', '5'),
(8, 13, '08/12/2018', 1, '4', 'Aucube', 'oui', '1', 'CKS', '1');

--
-- Index pour les tables exportées
--

--
-- Index pour la table `tble_obstretiq`
--
ALTER TABLE `tble_obstretiq`
  ADD PRIMARY KEY (`IDObstetriq`);

--
-- AUTO_INCREMENT pour les tables exportées
--

--
-- AUTO_INCREMENT pour la table `tble_obstretiq`
--
ALTER TABLE `tble_obstretiq`
  MODIFY `IDObstetriq` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
