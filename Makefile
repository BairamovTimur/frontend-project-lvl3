install:
	npm install

publish:
	npm publish --dry-run

lint:
	npx eslint .

test:
	npm test

test-watch:
	npx -n --experimental-vm-modules jest --watch

test-coverage:
	npm test -- --coverage
