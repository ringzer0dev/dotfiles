# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to your oh-my-zsh installation.
export ZSH="/root/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time oh-my-zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME="agkozak"

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in ~/.oh-my-zsh/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment the following line to disable bi-weekly auto-update checks.
# DISABLE_AUTO_UPDATE="true"

# Uncomment the following line to automatically update without prompting.
# DISABLE_UPDATE_PROMPT="true"

# Uncomment the following line to change how often to auto-update (in days).
# export UPDATE_ZSH_DAYS=13

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS=true

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in ~/.oh-my-zsh/plugins/*
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git
	virtualenv
	nice-exit-code
	bgnotify
	)

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

#################################
#	     ANTIGEN		#
#################################
source ~/.antigen/antigen.zsh

antigen use oh-my-zsh

antigen bundle git
antigen bundle heroku
antigen bundle pip
antigen bundle lein
antigen bundle command-not-found

antigen bundle zsh-users/zsh-syntax-highlighting

antigen bundle agkozak/agkozak-zsh-prompt

antigen apply


##################################
#	Agkozak Custom prompt	 #
##################################

# Username and hostname
AGKOZAK_CUSTOM_PROMPT=$'%F{yellow}λ %(!.%B.%B%F{green})%n%1v%(!.%b%s.%f%b) '
# Current working directory
AGKOZAK_CUSTOM_PROMPT+='%B%F{blue}%2v%f%b'
# Error codes
AGKOZAK_CUSTOM_PROMPT+=$' %(?..%B%F{red}(%?%)%f%b )\n'
# Promptline
AGKOZAK_CUSTOM_PROMPT+='%(4V.:.%F{cyan}#%f) '
# Right prompt (current git status)
AGKOZAK_CUSTOM_RPROMPT+='%(3V.%F{yellow}%3v%f.)'

# Aliases
alias cx="chmod +x"
alias al="ls -al"

# Path exports
export PATH=$PATH:~/bin/
export PATH=$PATH:/opt/idafree-7.0/
export PATH=$PATH:~/bin/Telegram/

# Tilix VTE config.
# Whatever 
if [ $TILIX_ID ] || [ $VTE_VERSION ]; then
        source /etc/profile.d/vte.sh
fi

###########################################
# C/C++ MinGW Static Compilation aider		  #
###########################################
 cmalw ()
 {
 	extension=".exe"
	file="${1}";
	base="$(basename ${file} .c)"
	base="$(basename ${base} .cpp)";
	i686-w64-mingw32-g++ "${file}" -o "${base}$extension" -s -lws2_32 -Wno-write-strings -fno-exceptions -fmerge-all-constants -static-libstdc++ -static-libgcc -Wall -ffunction-sections
#	i686-w64-mingw32-g++ prometheus.cpp -o prometheus.exe -lws2_32 -s -ffunction-sections -fdata-sections -Wno-write-strings -fno-exceptions -fmerge-all-constants -static-libstdc++ -static-libgcc
#
}

##########################################
#	Website cloning with wget
##########################################

webget ()
{
wget --mirror --convert-links --adjust-extension --page-requisites --no-parent $1
}




###########################################
# Assembly helper function		  
# Assembles and links .asm and .nasm files
###########################################

assemble ()
{
    name="${1}";
    base="$(basename ${name} .nasm)";
    base="$(basename ${base} .asm)";
    nasm -f elf64 "${name}" -o "${base}".o;
    ld "${base}".o -o "${base}"
}

##########################################
# Dump shellcode from assembled file
##########################################

dump-shellcode ()
{
    accum=0;
    sentry="No nulls found";
    for i in $(objdump -d "${1}" -M intel | grep "^ " | cut -f 2);
    do
        echo -nE '\x'$i;
        accum=$(( accum + 1 ));
        if [[ "${i}" = "00" ]]; then
            sentry="You have nulls, try again";
        fi;
    done;
    echo && echo "length of shellcode: $accum";
    echo "${sentry}"
}



