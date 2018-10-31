const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item
  }
  return blogs.length === 0 ? 0 : blogs.map(blog => blog.likes).reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const reducer = (previous, current) => {
    return (previous.likes > current.likes) ? previous : current
  }
  return blogs.length === 0 ? {} : blogs.reduce(reducer)
}

module.exports = {
  totalLikes,
  favoriteBlog
}