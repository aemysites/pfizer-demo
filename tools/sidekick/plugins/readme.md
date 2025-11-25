**Instructions to symlink for testing our @pfizer/franklin-sidekick-library**

from root symlink and confirm...
`ln -s ../franklin-sidekick-library/dist ./ ;   ls -l ./dist`

Then point temporarily to local symlink...

```
....

plugins: {
	blocks: {
	src: '/dist/plugins/blocks/blocks.js',
	encodeImages: true,

	
....

```



@References // 

[https://github.com/pfizer/franklin-sidekick-library ](https://github.com/pfizer/franklin-sidekick-library )