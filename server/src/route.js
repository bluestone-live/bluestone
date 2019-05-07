module.exports = router => {
  router.get('/', ctx => {
    ctx.body = 'Hello World!'
  })
}
