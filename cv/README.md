# English CV

Edit `cv/resume.tex` and compile from the repository root:

```sh
mkdir -p tmp/pdfs output/pdf
xelatex -interaction=nonstopmode -halt-on-error -output-directory=tmp/pdfs -jobname=benedek-bencz-cv cv/resume.tex
xelatex -interaction=nonstopmode -halt-on-error -output-directory=tmp/pdfs -jobname=benedek-bencz-cv cv/resume.tex
cp tmp/pdfs/benedek-bencz-cv.pdf output/pdf/benedek-bencz-cv.pdf
```

The source uses Computer Modern Unicode fonts included in TeX Live. No Awesome-CV class or external font directory is needed.

The English CV is condensed from `magyar_rovid.pdf`, with the requested October 2026 mesh. role and Physics Olympiad School entry. Camps, technical skills, interests, and Hungarian competitions other than OKTV are omitted. The school entry has no start date because the source gives a date only for private tutoring.

The source lists EOES medals in both Riga and Luxembourg as 2024. The Riga gold medal year is corrected to 2023, as confirmed by Benedek.
