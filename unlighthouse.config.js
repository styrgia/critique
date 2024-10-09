module.exports = {
    site: 'onlineconvertfree.com',
    scanner: {
        device: 'mobile',
        samples: 3,
        crawler: true,
        // throttle: true,
    },
    lighthouseOptions: {
        onlyCategories: ['performance']
    }
}
