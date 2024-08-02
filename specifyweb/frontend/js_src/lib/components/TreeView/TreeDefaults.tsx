/* Tree Defaults Order
botany
entomology
herpetology
ichthyology
invertebratepaleontology
invertebratezoology
mammalogy
ornithology
paleobotany
vacplant
vertebreatepaleontology
*/

const botanytreedef = {
  name: "Botany",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
        {
          "_name": "Life",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "0"
        },
        {
          "_name": "Kingdom",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "10"
        },
        {
          "_name": "Subkingdom",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "20"
        },
        {
          "_name": "Division",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "30"
        },
        {
          "_name": "Subdivision",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "40"
        },
        {
          "_name": "Class",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "60"
        },
        {
          "_name": "Subclass",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "70"
        },
        {
          "_name": "Superorder",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "90"
        },
        {
          "_name": "Order",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "100"
        },
        {
          "_name": "Suborder",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "110"
        },
        {
          "_name": "Family",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "140"
        },
        {
          "_name": "Genus",
          "_enforced": "true",
          "_infullname": "true",
          "_rank": "180"
        },
        {
          "_name": "Species",
          "_enforced": "true",
          "_infullname": "true",
          "_rank": "220"
        },
        {
          "_name": "Subspecies",
          "_enforced": "false",
          "_infullname": "true",
          "_rank": "230"
        },
        {
          "_name": "variety",
          "_enforced": "false",
          "_infullname": "true",
          "_rank": "240"
        },
        {
          "_name": "subvariety",
          "_enforced": "false",
          "_infullname": "true",
          "_rank": "250"
        },
        {
          "_name": "forma",
          "_enforced": "false",
          "_infullname": "true",
          "_rank": "260"
        },
        {
          "_name": "subforma",
          "_enforced": "false",
          "_infullname": "true",
          "_rank": "270"
        }
      ]
}


const entomologytreedef = {
  name: "Entomology",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
        {
          "_name": "Life",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "0"
        },
        {
          "_name": "Kingdom",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "10"
        },
        {
          "_name": "Phylum",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "30"
        },
        {
          "_name": "Subphylum",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "40"
        },
        {
          "_name": "Class",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "60"
        },
        {
          "_name": "Subclass",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "70"
        },
        {
          "_name": "Infraclass",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "80"
        },
        {
          "_name": "Superorder",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "90"
        },
        {
          "_name": "Order",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "100"
        },
        {
          "_name": "Suborder",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "110"
        },
        {
          "_name": "Infraorder",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "120"
        },
        {
          "_name": "Family",
          "_enforced": "true",
          "_infullname": "false",
          "_rank": "140"
        },
        {
          "_name": "Subfamily",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "150"
        },
        {
          "_name": "Tribe",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "160"
        },
        {
          "_name": "Subtribe",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "170"
        },
        {
          "_name": "Genus",
          "_enforced": "true",
          "_infullname": "true",
          "_rank": "180"
        },
        {
          "_name": "Subgenus",
          "_enforced": "false",
          "_infullname": "false",
          "_rank": "190"
        },
        {
          "_name": "Species",
          "_enforced": "true",
          "_infullname": "true",
          "_rank": "220"
        },
        {
          "_name": "Subspecies",
          "_enforced": "false",
          "_infullname": "true",
          "_rank": "230"
        }
      ]
}

const herpetologytreedef = {
  name: "Herpetology",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
      {
        "_name": "Life",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "0"
      },
      {
        "_name": "Kingdom",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "10"
      },
      {
        "_name": "Phylum",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "30"
      },
      {
        "_name": "Subphylum",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "40"
      },
      {
        "_name": "Class",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "60"
      },
      {
        "_name": "Subclass",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "70"
      },
      {
        "_name": "Superorder",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "90"
      },
      {
        "_name": "Order",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "100"
      },
      {
        "_name": "Family",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "140"
      },
      {
        "_name": "Subfamily",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "150"
      },
      {
        "_name": "Genus",
        "_enforced": "true",
        "_infullname": "true",
        "_rank": "180"
      },
      {
        "_name": "Species",
        "_enforced": "true",
        "_infullname": "true",
        "_rank": "220"
      },
      {
        "_name": "Subspecies",
        "_enforced": "false",
        "_infullname": "true",
        "_rank": "230"
      }
    ]
}

const ichthyologytreedef = {
  name: "Ichthyology",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
      {
        "_name": "Life",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "0"
      },
      {
        "_name": "Kingdom",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "10"
      },
      {
        "_name": "Phylum",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "30"
      },
      {
        "_name": "Subphylum",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "40"
      },
      {
        "_name": "Superclass",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "50"
      },
      {
        "_name": "Class",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "60"
      },
      {
        "_name": "Subclass",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "70"
      },
      {
        "_name": "Infraclass",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "80"
      },
      {
        "_name": "Superorder",
        "_enforced": "false",
        "_infullname": "false",
        "_rank": "90"
      },
      {
        "_name": "Order",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "100"
      },
      {
        "_name": "Family",
        "_enforced": "true",
        "_infullname": "false",
        "_rank": "140"
      },
      {
        "_name": "Genus",
        "_enforced": "true",
        "_infullname": "true",
        "_rank": "180"
      },
      {
        "_name": "Species",
        "_enforced": "true",
        "_infullname": "true",
        "_rank": "220"
      },
      {
        "_name": "Subspecies",
        "_enforced": "false",
        "_infullname": "true",
        "_rank": "230"
      }
    ]
}

const invertebratepaleontologytreedef = {
  name: "Invertebrate Paleontology",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
    {
      "_name": "Life",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "0"
    },
    {
      "_name": "Kingdom",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "10"
    },
    {
      "_name": "Phylum",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "30"
    },
    {
      "_name": "Class",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "60"
    },
    {
      "_name": "Subclass",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "70"
    },
    {
      "_name": "Superorder",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "90"
    },
    {
      "_name": "Order",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "100"
    },
    {
      "_name": "Family",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "140"
    },
    {
      "_name": "Genus",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "180"
    },
    {
      "_name": "Species",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "220"
    }
  ]
}

const invertebratezoologytreedef = {
  name: "Invertebrate Zoology",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
    {
      "_name": "Life",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "0"
    },
    {
      "_name": "Kingdom",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "10"
    },
    {
      "_name": "Phylum",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "30"
    },
    {
      "_name": "Class",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "60"
    },
    {
      "_name": "Subclass",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "70"
    },
    {
      "_name": "Superorder",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "90"
    },
    {
      "_name": "Order",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "100"
    },
    {
      "_name": "Suborder",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "110"
    },
    {
      "_name": "Family",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "140"
    },
    {
      "_name": "Subfamily",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "150"
    },
    {
      "_name": "Tribe",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "160"
    },
    {
      "_name": "Subtribe",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "170"
    },
    {
      "_name": "Genus",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "180"
    },
    {
      "_name": "Subgenus",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "190"
    },
    {
      "_name": "Species",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "220"
    },
    {
      "_name": "Subspecies",
      "_enforced": "false",
      "_infullname": "true",
      "_rank": "230"
    }
  ]
}

const mammalogytreedef = {
  name: "Mammalogy",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
    {
      "_name": "Life",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "0"
    },
    {
      "_name": "Kingdom",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "10"
    },
    {
      "_name": "Phylum",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "30"
    },
    {
      "_name": "Class",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "60"
    },
    {
      "_name": "Order",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "100"
    },
    {
      "_name": "Family",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "140"
    },
    {
      "_name": "Genus",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "180"
    },
    {
      "_name": "Species",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "220"
    },
    {
      "_name": "Subspecies",
      "_enforced": "false",
      "_infullname": "true",
      "_rank": "230"
    }
  ]
}

const ornithology = {
  name: "Ornithology",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
    {
      "_name": "Life",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "0"
    },
    {
      "_name": "Kingdom",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "10"
    },
    {
      "_name": "Phylum",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "30"
    },
    {
      "_name": "Subphylum",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "40"
    },
    {
      "_name": "Class",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "60"
    },
    {
      "_name": "Order",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "100"
    },
    {
      "_name": "Family",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "140"
    },
    {
      "_name": "Subfamily",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "150"
    },
    {
      "_name": "Genus",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "180"
    },
    {
      "_name": "Species",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "220"
    },
    {
      "_name": "Subspecies",
      "_enforced": "false",
      "_infullname": "true",
      "_rank": "230"
    }
  ]
}

const paleobotany = {
  name: "Paleobotany",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
    {
      "_name": "Life",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "0"
    },
    {
      "_name": "Kingdom",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "10"
    },
    {
      "_name": "Phylum",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "30"
    },
    {
      "_name": "Class",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "60"
    },
    {
      "_name": "Subclass",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "70"
    },
    {
      "_name": "Superorder",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "90"
    },
    {
      "_name": "Order",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "100"
    },
    {
      "_name": "Family",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "140"
    },
    {
      "_name": "Genus",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "180"
    },
    {
      "_name": "Species",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "220"
    }
  ]
}

const vacplant = {
  name: "Vascular Plant",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
    {
      "_name": "Life",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "0"
    },
    {
      "_name": "Kingdom",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "10"
    },
    {
      "_name": "Subkingdom",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "20"
    },
    {
      "_name": "Division",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "30"
    },
    {
      "_name": "Subdivision",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "40"
    },
    {
      "_name": "Class",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "60"
    },
    {
      "_name": "Subclass",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "70"
    },
    {
      "_name": "Superorder",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "90"
    },
    {
      "_name": "Order",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "100"
    },
    {
      "_name": "Suborder",
      "_enforced": "false",
      "_infullname": "false",
      "_rank": "110"
    },
    {
      "_name": "Family",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "140"
    },
    {
      "_name": "Genus",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "180"
    },
    {
      "_name": "Species",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "220"
    },
    {
      "_name": "Subspecies",
      "_enforced": "false",
      "_infullname": "true",
      "_rank": "230"
    },
    {
      "_name": "variety",
      "_enforced": "false",
      "_infullname": "true",
      "_rank": "240"
    },
    {
      "_name": "subvariety",
      "_enforced": "false",
      "_infullname": "true",
      "_rank": "250"
    },
    {
      "_name": "forma",
      "_enforced": "false",
      "_infullname": "true",
      "_rank": "260"
    },
    {
      "_name": "subforma",
      "_enforced": "false",
      "_infullname": "true",
      "_rank": "270"
    }
  ]
}

const vertebratepaleontology = {
  name: "Vertebrate Paleontology",
  remarks: "A default taxon tree",
  fullnamedirection: "forward",
  level: [
    {
      "_name": "Life",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "0"
    },
    {
      "_name": "Kingdom",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "10"
    },
    {
      "_name": "Phylum",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "30"
    },
    {
      "_name": "Class",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "60"
    },
    {
      "_name": "Order",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "100"
    },
    {
      "_name": "Family",
      "_enforced": "true",
      "_infullname": "false",
      "_rank": "140"
    },
    {
      "_name": "Genus",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "180"
    },
    {
      "_name": "Species",
      "_enforced": "true",
      "_infullname": "true",
      "_rank": "220"
    }
  ]
}