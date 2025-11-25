export default [
  {
    url: 'https://libraryfranklinpfizer-main-page.web.pfizer/',
    expect: true,
  },
  {
    url: 'https://libraryfranklinpfizer-main-page.web.pfizer/foo',
    expect: true,
  },
  {
    url: 'https://libraryfranklinpfizer-main-page.web.pfizer/foo/bar/baz/',
    expect: true,
  },
  {
    url: 'https://libraryfranklinpfizer-main-page.web.pfizer/foo/bar/baz?foo=bar',
    expect: true,
  },
  {
    url: 'libraryfranklinpfizer-main-page.web.pfizer',
    expect: 'https://libraryfranklinpfizer-main-page.web.pfizer is not valid',
  },
  {
    url: 'libraryfranklinpfizer-main-page.web.pfizer/',
    expect: true,
  },
  {
    url: 'libraryfranklinpfizer-main-page.web.pfizer/foo',
    expect: true,
  },
  {
    url: 'libraryfranklinpfizer-main-page.web.pfizer/foo/bar/baz/',
    expect: true,
  },
  {
    url: 'libraryfranklinpfizer-main-page.web.pfizer/foo/bar/baz?foo=bar',
    expect: true,
  },
  {
    url: 'https://www.google.com/',
    expect: 'Domain for https://www.google.com/ must be web.pfizer',
  },
  {
    url: 'main--libraryfranklinpfizer--pfizer.hlx.page/foo/bar/baz/',
    expect: 'Domain for https://main--libraryfranklinpfizer--pfizer.hlx.page/foo/bar/baz/ must be web.pfizer',
  },
];