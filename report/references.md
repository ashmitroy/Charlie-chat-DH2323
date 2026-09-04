# References (IEEE)

[1] T. Akenine-Möller, E. Haines, and N. Hoffman, *Real-Time Rendering*, 4th ed. Boca Raton, FL, USA: A K Peters/CRC Press, 2018.

[2] I. Quílez, “Rendering: Soft shadows (raymarching),” 2010. [Online]. Available: `https://iquilezles.org/articles/rmshadows/`

[3] J. C. Hart, “Sphere tracing: A geometric method for the antialiased ray tracing of implicit surfaces,” *The Visual Computer*, vol. 12, no. 10, pp. 527–545, 1996, doi: 10.1007/s003710050084.

[4] E. Reinhard, M. Stark, P. Shirley, and J. Ferwerda, “Photographic tone reproduction for digital images,” *ACM Trans. Graph.*, vol. 21, no. 3, pp. 267–276, Jul. 2002, doi: 10.1145/566654.566575.

[5] A. M. Turing, “Computing machinery and intelligence,” *Mind*, vol. 59, no. 236, pp. 433–460, 1950, doi: 10.1093/mind/LIX.236.433.

[6] S. Turkle, *Alone Together: Why We Expect More from Technology and Less from Each Other*. New York, NY, USA: Basic Books, 2011.

[7] R. Arnheim, *Art and Visual Perception: A Psychology of the Creative Eye*. Berkeley, CA, USA: University of California Press, 1954.

[8] M. Grimshaw, “The audio uncanny valley: Sound, fear and the horror game,” presented at the Fun and Games Conference, 2009. [Online]. Available: `https://vbn.aau.dk/en/publications/the-audio-uncanny-valley-sound-fear-and-the-horror-game/`

[9] M. M. Bradley and P. J. Lang, “Measuring emotion: The Self-Assessment Manikin and the semantic differential,” *J. Behav. Ther. Exp. Psychiatry*, vol. 25, no. 1, pp. 49–59, 1994, doi: 10.1016/0005-7916(94)90063-9.

---

## Removed 2026-08-27 (see `report.md` §9 for the full reasoning)

- **Holopainen, *Foundations of Gameplay* (2011)**: never verified as a real, citable publication; never cited in-text either.
- **Fernando, Ed., *GPU Gems* (2004)**: cited only for percentage-closer filtering / shadow mapping, a technique this project doesn't implement (the only shadow method is Quílez's SDF raymarch, [2] above).
- **Schüler, "Normal Mapping Without Precomputed Tangents" (2013)**: describes deriving a tangent-space basis for 3D mesh normal mapping; this project has no mesh and no tangent space, only a screen-space Sobel gradient on a height map. The technique used is real, the citation for it wasn't accurate.
