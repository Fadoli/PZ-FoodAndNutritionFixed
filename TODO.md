# TODO

Fish values should be /2 to take into account loss due to wastes

## Parser / Exporter

Make tools to automate some stuff in JS, this needs full export / import to work

## How to fix a broken game

1. Fix : Food nutriments table : <https://github.com/Fadoli/PZ-FoodAndNutritionFixed>
1. Fix : Foraging scales most properties but not medicinal ones : media\lua\shared\Foraging\forageDefinitions.lua
1. Fix : nutriments and calories should try to stabilize : loosing/gaining weight and the body regulates in blood nutriments level.
1. Document hidden moodles behaviors : <https://github.com/xChillax/PZBetterMoodlesDescriptions>
1. Document other hidden behaviors : <https://github.com/Fadoli/PZ-MoreMoodles>
1. Document foraging scaling
1. Document fishing zones

## Notes

### Doc multiplicateur foraging

-- 0.25 - 0.75 % taille
local sizeModifier = ((ZombRand(50) + 25) / 100);
-- (0.25 - 0.75) + (0.20 + 0.2*[0-perk])
sizeModifier = sizeModifier + ((ZombRand(perkLevel) + 1) / 5)
-- 0.45 - 0.95 + 0.2*[0-perk]
-- 0.45 - 0.95 .... 2.45 - 2.95

### Doc fishing zone

Les zones de pêches se font reset 20000 unité de temps après la dernière pêche. random(10-25) + RaretéRessourceNaturelle(-10, +15)
